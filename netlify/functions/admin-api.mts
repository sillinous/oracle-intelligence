import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  const h = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const adminKey = req.headers.get("x-admin-key") || new URL(req.url).searchParams.get("key");
  if (!adminKey || adminKey !== Netlify.env.get("ADMIN_KEY")) return Response.json({ error: "Unauthorized" }, { status: 401, headers: h });
  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "stats";
  if (action === "stats") {
    const orders = getStore("orders"); const purchases = getStore("purchases"); const reports = getStore("reports"); const leads = getStore("quiz-leads");
    const [o,p,r,l] = await Promise.all([orders.list(), purchases.list(), reports.list(), leads.list()]);
    return Response.json({ orders: o.blobs.length, purchases: p.blobs.length, reports: r.blobs.length, leads: l.blobs.length, timestamp: new Date().toISOString() }, { headers: h });
  }
  if (action === "purchases") { const s = getStore("purchases"); const list = await s.list(); const items = []; for (const k of list.blobs.slice(0,100)) { try { items.push(JSON.parse(await s.get(k.key)||"{}")); } catch {} } return Response.json({ items }, { headers: h }); }
  if (action === "leads") { const s = getStore("quiz-leads"); const list = await s.list(); const items = []; for (const k of list.blobs.slice(0,100)) { try { items.push(JSON.parse(await s.get(k.key)||"{}")); } catch {} } return Response.json({ items }, { headers: h }); }
  return Response.json({ error: "Unknown action" }, { status: 400, headers: h });
};
export const config: Config = { path: "/api/admin" };
