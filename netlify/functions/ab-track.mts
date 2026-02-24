import { getStore } from "@netlify/blobs";
import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  const h = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
  if (req.method === "GET") {
    const store = getStore("ab-tests");
    const list = await store.list(); const data: any = {};
    for (const k of list.blobs) { try { data[k.key] = JSON.parse(await store.get(k.key) || "{}"); } catch {} }
    return Response.json(data, { headers: h });
  }
  const body = await req.json();
  if (!body.experiment || !body.variant || !body.event) return new Response("Missing params", { status: 400, headers: h });
  const store = getStore("ab-tests");
  const key = `${body.experiment}_${body.variant}`;
  let counts: any = {};
  try { counts = JSON.parse(await store.get(key) || "{}"); } catch {}
  counts[body.event] = (counts[body.event] || 0) + 1;
  counts.lastUpdated = new Date().toISOString();
  await store.set(key, JSON.stringify(counts));
  return Response.json({ tracked: true, experiment: body.experiment, variant: body.variant }, { headers: h });
};
export const config: Config = { path: "/api/ab-track" };
