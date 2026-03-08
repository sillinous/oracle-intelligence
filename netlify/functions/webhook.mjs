import { getStore } from "@netlify/blobs";


/**
 * Verify Stripe webhook signature using HMAC-SHA256.
 * Falls back to unverified parsing if STRIPE_WEBHOOK_SECRET is not set.
 */
async function verifyStripeSignature(body, sigHeader, secret) {
  if (!secret || !sigHeader) return null; // skip verification if not configured

  const pairs = {};
  for (const part of sigHeader.split(",")) {
    const [k, v] = part.split("=");
    pairs[k.trim()] = v;
  }

  const timestamp = pairs["t"];
  const signature = pairs["v1"];
  if (!timestamp || !signature) return null;

  // Reject requests older than 5 minutes to prevent replay attacks
  const age = Math.abs(Date.now() / 1000 - parseInt(timestamp, 10));
  if (age > 300) throw new Error("Webhook timestamp too old");

  const payload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const computed = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");

  if (computed !== signature) throw new Error("Invalid webhook signature");
  return true;
}

export default async (req, context) => {
  const headers = { "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204 });
  if (req.method !== "POST") return new Response(JSON.stringify({ received: true }), { status: 200, headers });

  const STRIPE_KEY = process.env["STRIPE_SECRET_KEY"];
  const STRIPE_WEBHOOK_SECRET = process.env["STRIPE_WEBHOOK_SECRET"];
  const RESEND_KEY = process.env["RESEND_API_KEY"];

  try {
    const body = await req.text();
    const sigHeader = req.headers.get("stripe-signature");

    // Verify Stripe webhook signature if secret is configured
    try {
      await verifyStripeSignature(body, sigHeader, STRIPE_WEBHOOK_SECRET);
    } catch (sigErr) {
      console.error("Stripe signature verification failed:", sigErr.message);
      return new Response(JSON.stringify({ error: "Signature verification failed" }), { status: 401, headers });
    }
    if (!STRIPE_WEBHOOK_SECRET) {
      console.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
    }

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
      } catch (triggerErr) {
        console.error("Report generation trigger failed:", triggerErr.message);
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200, headers });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ received: true }), { status: 200, headers });
  }
};

export const config = { path: "/api/webhook" };
