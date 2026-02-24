import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  const h = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  const store = getStore("feedback");
  if (req.method === "GET") {
    const list = await store.list(); const items = [];
    for (const k of list.blobs.slice(0,50)) { try { items.push(JSON.parse(await store.get(k.key) || "{}")); } catch {} }
    return Response.json({ count: items.length, items }, { headers: h });
  }
  const body = await req.json();
  if (!body.type || !body.message) return Response.json({ error: "Missing required fields" }, { status: 400, headers: h });
  const id = `fb_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
  await store.set(id, JSON.stringify({ id, ...body, created: new Date().toISOString() }));
  return Response.json({ ok: true, id }, { headers: h });
};
export const config: Config = { path: "/api/feedback" };
