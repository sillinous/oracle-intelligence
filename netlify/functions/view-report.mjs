import { getStore } from "@netlify/blobs";

export default async (req) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });

  const url = new URL(req.url);
  const reportId = url.searchParams.get("id");

  if (!reportId) {
    return new Response(JSON.stringify({ error: "Report ID required" }), { status: 400, headers });
  }

  try {
    const store = getStore("reports");
    const raw = await store.get(reportId);

    if (!raw) {
      return new Response(JSON.stringify({ error: "Report not found" }), { status: 404, headers });
    }

    const data = JSON.parse(raw);

    // Return report data (strip email for privacy)
    return new Response(JSON.stringify({
      id: data.id,
      market: data.market,
      tier: data.tier,
      report: data.report,
      name: data.name,
      created: data.created,
    }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to retrieve report" }), { status: 500, headers });
  }
};

export const config = { path: "/api/view-report" };
