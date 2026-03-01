import { getStore } from "@netlify/blobs";


export default async (req, context) => {
  const headers = { "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return new Response(JSON.stringify({ received: true }), { status: 200, headers });

  const STRIPE_KEY = process.env["STRIPE_SECRET_KEY"];
  const STRIPE_WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"];
  const RESEND_KEY = process.env["RESEND_API_KEY"];

  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // For now, parse the event directly (add signature verification later with stripe SDK)
    const event = JSON.parse(body);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const { tier, market, name, platform } = session.metadata || {};
      const email = session.customer_details?.email || session.customer_email;

      if (platform !== "aperture" && !tier) return new Response(JSON.stringify({ received: true }), { status: 200, headers });

      // Store purchase
      const store = getStore("purchases");
      const purchaseId = `purchase_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
      await store.set(purchaseId, JSON.stringify({
        id: purchaseId, sessionId: session.id, tier, market, email, name,
        amount: session.amount_total, created: new Date().toISOString(), status: "paid",
      }));

      // Send confirmation email with fallback domain
      const siteUrl = process.env["URL"] || "https://aperture-intel.netlify.app";
      if (RESEND_KEY && email) {
        const tierLabel = (tier || "standard").charAt(0).toUpperCase() + (tier || "").slice(1);
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
                subject: `Your APERTURE ${tierLabel} Report is Being Generated`,
                html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
                  <h2 style="color:#1a1a2e">Your Report is Being Generated</h2>
                  <p>Hi ${name || "there"},</p>
                  <p>Thank you for your purchase! Your <strong>${tierLabel} Report</strong> for <strong>${market || "your market"}</strong> is being generated.</p>
                  <p>You'll receive a follow-up email with a link to view your full report online within <strong>5 minutes</strong>. You can also view it directly on the success page.</p>
                  <hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
                  <p style="color:#666;font-size:13px">APERTURE Intelligence — AI Market Research in Minutes<br/>
                  <a href="${siteUrl}" style="color:#b8943f">${siteUrl.replace("https://","")}</a></p>
                </div>`,
              }),
            });
            const emailData = await emailRes.json();
            if (emailRes.ok && emailData.id) {
              console.log("Confirmation email sent via", fromAddr, "id:", emailData.id);
              break;
            } else {
              console.error("Confirmation email failed with", fromAddr, ":", emailData.message || JSON.stringify(emailData));
            }
          } catch (emailErr) {
            console.error("Confirmation email error with", fromAddr, ":", emailErr.message);
          }
        }
      }

      // Trigger report generation (fire and forget)
      try {
        await fetch(`${siteUrl}/api/research`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": process.env["ADMIN_KEY"] || "" },
          body: JSON.stringify({ market, tier, email, name, purchaseId }),
        });
      } catch {}
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ received: true }), { status: 200, headers });
  }
};

export const config = { path: "/api/webhook" };
