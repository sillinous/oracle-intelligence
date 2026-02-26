import { getStore } from "@netlify/blobs";

export default async (req) => {
  const h = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };
  const adminKey = req.headers.get("x-admin-key");
  if (!adminKey || adminKey !== process.env["ADMIN_KEY"]) return new Response("Unauthorized", { status: 401, headers: h });
  const body = await req.json();
  const { reportId, email, tier } = body;
  const store = getStore("reports");
  if (reportId) { try { const report = await store.get(reportId); return Response.json({ report: JSON.parse(report || "{}") }, { headers: h }); } catch { return Response.json({ error: "Report not found" }, { status: 404, headers: h }); } }
  return Response.json({ error: "reportId required" }, { status: 400, headers: h });
};
export const config = { path: "/api/distribution" };
