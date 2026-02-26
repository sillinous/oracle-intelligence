import { getStore } from "@netlify/blobs";


export default async (req) => {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method !== "POST") return Response.json({ error: "POST required" }, { status: 405, headers: h });

  try {
    const { email, source } = await req.json();
    if (!email) return Response.json({ error: "Email required" }, { status: 400, headers: h });

    const store = getStore("email-subscribers");
    const key = `sub_${email.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
    
    await store.set(key, JSON.stringify({
      email: email.toLowerCase().trim(),
      source: source || "landing",
      subscribed: new Date().toISOString(),
    }));

    // Send welcome email via Resend if configured
    const RESEND_KEY = process.env["RESEND_API_KEY"];
    if (RESEND_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "ORACLE Intelligence <hello@oraclereports.ai>",
            to: [email],
            subject: "Welcome to ORACLE Intelligence",
            html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
              <h2 style="color:#b8943f;">Welcome to ORACLE Intelligence</h2>
              <p>You're now subscribed to receive market intelligence insights, industry analysis, and exclusive report previews.</p>
              <p>In the meantime, explore our <a href="https://oracle-intelligence.netlify.app/#pricing" style="color:#b8943f;">AI-powered market reports</a> — what consultants charge $15K for, starting at $19.</p>
              <p style="color:#666;font-size:14px;">— The ORACLE Team</p>
            </div>`,
          }),
        });
      } catch {}
    }

    return Response.json({ ok: true, message: "Subscribed" }, { headers: h });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: h });
  }
};

export const config = { path: "/api/email-capture" };
