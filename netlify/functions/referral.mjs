import { getStore } from "@netlify/blobs";

// Commission rate and tier-based earnings for referral tracking
const COMMISSION_RATE = 0.20; // 20% referral commission
const TIER_PRICES = { pulse: 1900, starter: 3900, professional: 9900, strategic: 19900 };

export default async (req) => {
  const h = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Content-Type": "application/json" };
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });

  const store = getStore("referrals");

  if (req.method === "GET") {
    const email = new URL(req.url).searchParams.get("email");
    if (!email) return Response.json({ error: "email required" }, { status: 400, headers: h });
    try {
      const data = await store.get(`ref_${email.replace(/[^a-zA-Z0-9]/g, "_")}`);
      return Response.json(data ? JSON.parse(data) : { email, referrals: 0, earned: 0, history: [] }, { headers: h });
    } catch (err) {
      console.error("Referral lookup error:", err.message);
      return Response.json({ email, referrals: 0, earned: 0, history: [] }, { headers: h });
    }
  }

  try {
    const body = await req.json();
    if (!body.referrer || !body.referred) {
      return Response.json({ error: "referrer and referred emails required" }, { status: 400, headers: h });
    }

    const key = `ref_${body.referrer.replace(/[^a-zA-Z0-9]/g, "_")}`;
    let data = { email: body.referrer, referrals: 0, earned: 0, history: [] };
    try {
      const existing = await store.get(key);
      if (existing) data = JSON.parse(existing);
    } catch (parseErr) {
      console.error("Failed to parse referral data:", parseErr.message);
    }

    // Calculate commission earned from this referral
    const tier = body.tier || "starter";
    const priceInCents = TIER_PRICES[tier] || TIER_PRICES.starter;
    const commission = Math.round(priceInCents * COMMISSION_RATE);

    data.referrals++;
    data.earned += commission;
    data.history.push({
      referred: body.referred,
      tier,
      commission,
      date: new Date().toISOString(),
    });

    await store.set(key, JSON.stringify(data));

    return Response.json({
      tracked: true,
      totalReferrals: data.referrals,
      totalEarned: data.earned,
      lastCommission: commission,
    }, { headers: h });
  } catch (err) {
    console.error("Referral tracking error:", err.message);
    return Response.json({ error: err.message }, { status: 500, headers: h });
  }
};

export const config = { path: "/api/referral" };
