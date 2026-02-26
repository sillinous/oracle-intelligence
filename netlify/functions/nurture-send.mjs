import { getStore } from "@netlify/blobs";

export default async (req) => {
  const RESEND_KEY = process.env["RESEND_API_KEY"];
  if (!RESEND_KEY) return Response.json({ skipped: "no email key" });
  const store = getStore("quiz-leads");
  const list = await store.list();
  let nurtured = 0;
  for (const k of list.blobs.slice(0,50)) {
    try {
      const lead = JSON.parse(await store.get(k.key) || "{}");
      if (!lead.email || lead.purchased) continue;
      const age = (Date.now() - new Date(lead.created || 0).getTime()) / 86400000;
      if (age >= 2 && age <= 7 && !lead.nurtureSent) {
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: "ORACLE Intelligence <reports@oraclereports.ai>", to: [lead.email], subject: "Your free market snapshot is waiting", html: `<p>Hi${lead.name ? ` ${lead.name}` : ""},</p><p>You recently took our Market Intelligence Quiz. Your personalized snapshot is ready — <a href="https://oracle-intelligence.netlify.app/markets/${lead.recommendedMarket || ""}">view it here</a>.</p><p>Want the full report? <a href="https://oracle-intelligence.netlify.app/#pricing">See our plans</a> starting at $19.</p><p>— ORACLE Intelligence</p>` }),
          });
          lead.nurtureSent = new Date().toISOString();
          await store.set(k.key, JSON.stringify(lead));
          nurtured++;
        } catch {}
      }
    } catch {}
  }
  return Response.json({ processed: list.blobs.length, nurtured });
};
export const config = { schedule: "0 9 * * *" };
