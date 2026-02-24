import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  const RESEND_KEY = Netlify.env.get("RESEND_API_KEY");
  if (!RESEND_KEY) return Response.json({ skipped: "no email key" });
  const store = getStore("purchases");
  const list = await store.list();
  let upsold = 0;
  for (const k of list.blobs.slice(0,50)) {
    try {
      const purchase = JSON.parse(await store.get(k.key) || "{}");
      if (!purchase.email || purchase.upsellSent) continue;
      if (purchase.tier === "strategic") continue;
      const age = (Date.now() - new Date(purchase.created || 0).getTime()) / 86400000;
      if (age >= 3 && age <= 10) {
        const nextTier = { pulse: "starter", starter: "professional", professional: "strategic" }[purchase.tier as string] || "professional";
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST", headers: { Authorization: `Bearer ${RESEND_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({ from: "ORACLE Intelligence <reports@oraclereports.ai>", to: [purchase.email], subject: `Upgrade to ${nextTier.charAt(0).toUpperCase()+nextTier.slice(1)} for deeper insights`, html: `<p>Hi${purchase.name ? ` ${purchase.name}` : ""},</p><p>Your ${purchase.tier} report for "${purchase.market}" was just the beginning.</p><p>Upgrade to our <strong>${nextTier}</strong> tier for deeper competitive analysis, regulatory insights, and strategic recommendations.</p><p><a href="https://oracle-intelligence.netlify.app/#pricing">View upgrade options →</a></p><p>— ORACLE Intelligence</p>` }),
          });
          purchase.upsellSent = new Date().toISOString();
          await store.set(k.key, JSON.stringify(purchase));
          upsold++;
        } catch {}
      }
    } catch {}
  }
  return Response.json({ processed: list.blobs.length, upsold });
};
export const config: Config = { schedule: "0 10 * * *" };
