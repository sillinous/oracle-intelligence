import { getStore } from "@netlify/blobs";


export default async (req, context) => {
  const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, x-admin-key", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405, headers });

  const ADMIN_KEY = process.env["ADMIN_KEY"];
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== ADMIN_KEY) return new Response("Unauthorized", { status: 401, headers });

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

    // Email report
    const RESEND_KEY = process.env["RESEND_API_KEY"];
    if (RESEND_KEY && email) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "APERTURE Intelligence <reports@aperturereports.ai>",
            to: [email],
            subject: `Your APERTURE ${(tier||"").charAt(0).toUpperCase()+(tier||"").slice(1)} Report: ${market}`,
            html: `<div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:24px">
              <h2>🔮 Your APERTURE Report is Ready</h2>
              <p>Hi ${name || "there"},</p>
              <p>Your <strong>${market}</strong> market intelligence report is attached below.</p>
              <div style="background:#f8f9fa;border:1px solid #e0e0e0;border-radius:8px;padding:24px;margin:24px 0;white-space:pre-wrap;font-size:14px;line-height:1.6">${report.replace(/</g,"&lt;").replace(/>/g,"&gt;")}</div>
              <p>Want deeper analysis? <a href="https://aperture-intel.netlify.app/#pricing">Upgrade your report tier</a></p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
              <p style="color:#666;font-size:12px">APERTURE Intelligence — AI Market Research in Minutes<br/>
              <a href="https://aperture-intel.netlify.app">aperture-intel.netlify.app</a></p>
            </div>`,
          }),
        });
      } catch {}
    }

    return new Response(JSON.stringify({ reportId, market, tier, generated: true }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/research" };
