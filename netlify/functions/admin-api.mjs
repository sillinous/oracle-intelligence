import { getStore } from "@netlify/blobs";

/**
 * Helper to list items from a Netlify Blob store with pagination support.
 */
async function listStoreItems(storeName, limit = 100) {
  const store = getStore(storeName);
  const list = await store.list();
  const items = [];
  for (const k of list.blobs.slice(0, limit)) {
    try {
      items.push(JSON.parse(await store.get(k.key) || "{}"));
    } catch (err) {
      console.error(`Failed to parse ${storeName} item ${k.key}:`, err.message);
    }
  }
  return { items, total: list.blobs.length };
}

export default async (req) => {
  const h = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-admin-key",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });

  const adminKey = req.headers.get("x-admin-key") || new URL(req.url).searchParams.get("key");
  if (!adminKey || adminKey !== process.env["ADMIN_KEY"]) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers: h });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") || "stats";

  try {
    if (action === "stats") {
      const stores = ["orders", "purchases", "reports", "quiz-leads", "email-subscribers", "feedback", "referrals", "ab-tests"];
      const lists = await Promise.all(stores.map(s => getStore(s).list().catch(() => ({ blobs: [] }))));
      return Response.json({
        orders: lists[0].blobs.length,
        purchases: lists[1].blobs.length,
        reports: lists[2].blobs.length,
        leads: lists[3].blobs.length,
        subscribers: lists[4].blobs.length,
        feedback: lists[5].blobs.length,
        referrals: lists[6].blobs.length,
        abTests: lists[7].blobs.length,
        timestamp: new Date().toISOString(),
      }, { headers: h });
    }

    if (action === "purchases") {
      const { items, total } = await listStoreItems("purchases");
      return Response.json({ items, total }, { headers: h });
    }

    if (action === "leads") {
      const { items, total } = await listStoreItems("quiz-leads");
      return Response.json({ items, total }, { headers: h });
    }

    if (action === "reports") {
      const { items, total } = await listStoreItems("reports");
      // Strip full report content for listing — return metadata only
      const summaries = items.map(r => ({
        id: r.id, market: r.market, tier: r.tier, email: r.email,
        name: r.name, created: r.created, purchaseId: r.purchaseId,
      }));
      return Response.json({ items: summaries, total }, { headers: h });
    }

    if (action === "subscribers") {
      const { items, total } = await listStoreItems("email-subscribers");
      return Response.json({ items, total }, { headers: h });
    }

    if (action === "feedback") {
      const { items, total } = await listStoreItems("feedback", 50);
      return Response.json({ items, total }, { headers: h });
    }

    if (action === "referrals") {
      const { items, total } = await listStoreItems("referrals");
      return Response.json({ items, total }, { headers: h });
    }

    return Response.json({
      error: "Unknown action",
      validActions: ["stats", "purchases", "leads", "reports", "subscribers", "feedback", "referrals"],
    }, { status: 400, headers: h });
  } catch (err) {
    console.error("Admin API error:", err.message);
    return Response.json({ error: err.message }, { status: 500, headers: h });
  }
};

export const config = { path: "/api/admin" };
