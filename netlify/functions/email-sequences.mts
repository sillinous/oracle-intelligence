import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  const RESEND_KEY = Netlify.env.get("RESEND_API_KEY");
  if (!RESEND_KEY) return Response.json({ error: "Email not configured" }, { status: 500 });
  const store = getStore("email-sequences");
  const leads = getStore("quiz-leads");
  const leadList = await leads.list();
  let sent = 0;
  for (const k of leadList.blobs.slice(0, 20)) {
    try {
      const lead = JSON.parse(await leads.get(k.key) || "{}");
      if (!lead.email) continue;
      const seqKey = `seq_${lead.email.replace(/[^a-zA-Z0-9]/g,"_")}`;
      let seq: any = { step: 0, lastSent: null };
      try { const raw = await store.get(seqKey); if (raw) seq = JSON.parse(raw); } catch {}
      const daysSinceCapture = (Date.now() - new Date(lead.created || 0).getTime()) / 86400000;
      if (seq.step === 0 && daysSinceCapture >= 1) { seq.step = 1; seq.lastSent = new Date().toISOString(); await store.set(seqKey, JSON.stringify(seq)); sent++; }
      else if (seq.step === 1 && daysSinceCapture >= 3) { seq.step = 2; seq.lastSent = new Date().toISOString(); await store.set(seqKey, JSON.stringify(seq)); sent++; }
    } catch {}
  }
  return Response.json({ processed: leadList.blobs.length, sent });
};
export const config: Config = { schedule: "@hourly" };
