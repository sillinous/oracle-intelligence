import { getStore } from "@netlify/blobs";

export default async (req) => {
  const h = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const store = getStore("referrals");
  if (req.method === "GET") {
    const email = new URL(req.url).searchParams.get("email");
    if (!email) return Response.json({ error: "email required" }, { status: 400, headers: h });
    try { const data = await store.get(`ref_${email.replace(/[^a-zA-Z0-9]/g,"_")}`); return Response.json(data ? JSON.parse(data) : { email, referrals: 0, earned: 0 }, { headers: h }); } catch { return Response.json({ email, referrals: 0, earned: 0 }, { headers: h }); }
  }
  const body = await req.json();
  if (!body.referrer || !body.referred) return Response.json({ error: "referrer and referred emails required" }, { status: 400, headers: h });
  const key = `ref_${body.referrer.replace(/[^a-zA-Z0-9]/g,"_")}`;
  let data = { email: body.referrer, referrals: 0, earned: 0, history: [] };
  try { const existing = await store.get(key); if (existing) data = JSON.parse(existing); } catch {}
  data.referrals++; data.history.push({ referred: body.referred, date: new Date().toISOString() });
  await store.set(key, JSON.stringify(data));
  return Response.json({ tracked: true, totalReferrals: data.referrals }, { headers: h });
};
export const config = { path: "/api/referral" };
