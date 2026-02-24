import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response("OK", { headers: cors });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST only" }), { status: 405, headers: cors });

  try {
    const body = await req.json();
    const { name, email, industry, companySize, researchFrequency, primaryNeed, answers } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: "Email required" }), { status: 400, headers: cors });
    }

    const store = getStore("quiz-leads");
    const id = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const lead = {
      id,
      name: name || "",
      email: email.toLowerCase().trim(),
      industry: industry || answers?.industry || "",
      companySize: companySize || answers?.companySize || "",
      researchFrequency: researchFrequency || answers?.researchFrequency || "",
      primaryNeed: primaryNeed || answers?.primaryNeed || "",
      answers: answers || {},
      source: "quiz",
      createdAt: new Date().toISOString(),
      geo: context?.geo || {},
      nurtureStatus: "new",
    };

    await store.set(id, JSON.stringify(lead));

    // Also store by email for dedup
    await store.set(`email_${lead.email.replace(/[^a-z0-9]/g, '_')}`, JSON.stringify(lead));

    // Determine recommended tier based on answers
    let recommendedTier = "starter";
    if (lead.researchFrequency === "weekly" || lead.companySize === "50+") {
      recommendedTier = "professional";
    }
    if (lead.companySize === "200+" || lead.primaryNeed === "competitive-intelligence") {
      recommendedTier = "strategic";
    }

    // Send welcome email via Resend (fire-and-forget)
    const RESEND_KEY = process.env.RESEND_API_KEY;
    if (RESEND_KEY && lead.email) {
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_KEY}`,
        },
        body: JSON.stringify({
          from: "ORACLE Intelligence <hello@oraclereports.ai>",
          to: lead.email,
          subject: `Your ${lead.industry || 'market'} intelligence snapshot is ready`,
          html: `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
            <h1 style="color:#b8943f;font-size:24px;">ORACLE Intelligence</h1>
            <p>Hi ${lead.name || 'there'},</p>
            <p>Thanks for taking the market intelligence quiz. Based on your answers, we recommend our <strong>${recommendedTier}</strong> tier for your needs.</p>
            <p>Your free market snapshot for <strong>${lead.industry || 'your industry'}</strong> includes TAM sizing, growth rates, and competitive landscape overview.</p>
            <p><a href="https://oracle-intelligence.netlify.app/markets/" style="display:inline-block;background:#b8943f;color:#fff;padding:12px 24px;text-decoration:none;font-weight:bold;">View Your Snapshot →</a></p>
            <p>For a full professional report with AI-synthesized insights, competitor deep dives, and strategic recommendations — delivered in 5 minutes — <a href="https://oracle-intelligence.netlify.app/#pricing" style="color:#b8943f;">explore our report options</a>.</p>
            <p style="color:#666;font-size:14px;">— The ORACLE Team</p>
          </div>`,
        }),
      }).catch(() => {});
    }

    return new Response(JSON.stringify({
      ok: true,
      id,
      recommendedTier,
      snapshotUrl: lead.industry
        ? `https://oracle-intelligence.netlify.app/markets/${lead.industry.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
        : "https://oracle-intelligence.netlify.app/markets/",
    }), { headers: cors });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: cors });
  }
};
