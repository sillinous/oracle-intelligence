import { getStore } from "@netlify/blobs";


export default async (req, context) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-key", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405, headers });

  // TEST MODE: bypass admin key check (re-enable for production payments)
  // const ADMIN_KEY = process.env["ADMIN_KEY"];
  // const adminKey = req.headers.get("x-admin-key");
  // if (!adminKey || adminKey !== ADMIN_KEY) return new Response("Unauthorized", { status: 401, headers });

  const OPENROUTER_KEY = process.env["OPENROUTER_API_KEY"];
  if (!OPENROUTER_KEY) return new Response(JSON.stringify({ error: "AI not configured" }), { status: 500, headers });

  try {
    const { market, tier, email, name, purchaseId } = await req.json();
    if (!market) return new Response(JSON.stringify({ error: "market required" }), { status: 400, headers });

    const depth = { pulse: "brief", starter: "standard", professional: "detailed", strategic: "comprehensive" }[tier] || "standard";
    const model = tier === "strategic" ? "anthropic/claude-sonnet-4-20250514" : "anthropic/claude-3.5-haiku";

    const prompt = `Generate a ${depth} market intelligence report for: "${market}"

Include these sections:
1. Executive Summary
2. Market Size (TAM/SAM/SOM with estimates)
3. Growth Rate & Trajectory (5-year forecast)
4. Competitive Landscape (top 5-10 players)
5. Key Trends & Drivers
6. Risks & Challenges
${tier === "professional" || tier === "strategic" ? `7. Regulatory Environment
8. Technology & Innovation Trends
9. Customer Segmentation
10. Geographic Analysis` : ""}
${tier === "strategic" ? `11. Strategic Recommendations
12. Investment Thesis
13. Scenario Analysis (bull/base/bear)
14. Action Plan (30/60/90 day)` : ""}

Format as structured markdown. Use real data where available. Be specific with numbers, companies, and trends.`;

    const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_KEY}`, "HTTP-Referer": "https://aperture-intel.netlify.app" },
      body: JSON.stringify({ model, messages: [{ role: "system", content: "You are APERTURE, an expert market intelligence analyst. Produce detailed, data-driven market research reports." }, { role: "user", content: prompt }], max_tokens: tier === "strategic" ? 8000 : tier === "professional" ? 6000 : tier === "starter" ? 4000 : 2000 }),
    });

    const aiData = await aiRes.json();
    const report = aiData.choices?.[0]?.message?.content || "";

    // Store report
    const store = getStore("reports");
    const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
    await store.set(reportId, JSON.stringify({ id: reportId, market, tier, report, email, name, purchaseId, created: new Date().toISOString() }));

    // Email report with view link
    const RESEND_KEY = process.env["RESEND_API_KEY"];
    const siteUrl = process.env["URL"] || "https://aperture-intel.netlify.app";
    const viewUrl = `${siteUrl}/report.html?id=${encodeURIComponent(reportId)}`;
    let emailSent = false;
    let emailError = null;

    if (RESEND_KEY && email) {
      const tierLabel = (tier || "").charAt(0).toUpperCase() + (tier || "").slice(1);
      const escapedReport = report.replace(/</g, "&lt;").replace(/>/g, "&gt;");

      // Try sending with custom domain first, fall back to Resend default domain
      const fromAddresses = [
        "APERTURE Intelligence <reports@aperturereports.ai>",
        "APERTURE Intelligence <onboarding@resend.dev>",
      ];

      for (const fromAddr of fromAddresses) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: fromAddr,
              to: [email],
              subject: `Your APERTURE ${tierLabel} Report: ${market}`,
              html: `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px">
                <h2 style="color:#1a1a2e">Your APERTURE Report is Ready</h2>
                <p>Hi ${name || "there"},</p>
                <p>Your <strong>${market}</strong> market intelligence report has been generated.</p>
                <div style="background:#f0f7ff;border:1px solid #c0d8f0;border-radius:8px;padding:20px;margin:20px 0;text-align:center">
                  <p style="margin:0 0 12px;font-size:15px;color:#333"><strong>View your full report online:</strong></p>
                  <a href="${viewUrl}" style="display:inline-block;background:#b8943f;color:#fff;text-decoration:none;padding:12px 28px;border-radius:6px;font-weight:600;font-size:15px">View Report</a>
                  <p style="margin:12px 0 0;font-size:12px;color:#888">Bookmark this link to access your report anytime</p>
                </div>
                <p style="font-size:13px;color:#666;margin-bottom:8px"><strong>Report preview:</strong></p>
                <div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin:0 0 24px;white-space:pre-wrap;font-size:13px;line-height:1.6;max-height:600px;overflow:hidden">${escapedReport}</div>
                <p style="text-align:center"><a href="${viewUrl}" style="color:#b8943f;font-weight:600">View full report online &rarr;</a></p>
                <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                <p>Want deeper analysis? <a href="${siteUrl}/#pricing" style="color:#b8943f">Upgrade your report tier</a></p>
                <p style="color:#999;font-size:11px">APERTURE Intelligence — AI Market Research in Minutes<br/>
                <a href="${siteUrl}" style="color:#999">${siteUrl.replace("https://","")}</a></p>
              </div>`,
            }),
          });

          const emailData = await emailRes.json();
          if (emailRes.ok && emailData.id) {
            emailSent = true;
            console.log("Email sent successfully via", fromAddr, "id:", emailData.id);
            break;
          } else {
            emailError = emailData.message || emailData.error || JSON.stringify(emailData);
            console.error("Email send failed with", fromAddr, ":", emailError);
          }
        } catch (err) {
          emailError = err.message;
          console.error("Email send error with", fromAddr, ":", err.message);
        }
      }

      if (!emailSent) {
        console.error("All email attempts failed. Last error:", emailError);
      }
    } else {
      console.warn("Email not sent: RESEND_API_KEY", RESEND_KEY ? "present" : "missing", "| email:", email || "missing");
    }

    return new Response(JSON.stringify({ reportId, market, tier, generated: true, viewUrl, emailSent, emailError: emailSent ? null : emailError }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/research" };
