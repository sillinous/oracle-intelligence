import { getStore } from "@netlify/blobs";


const TIERS = {
  pulse:        { price: 1900,  name: "Pulse Report",        desc: "Quick market snapshot — TAM estimate, top 5 competitors, key trends" },
  starter:      { price: 3900,  name: "Starter Report",      desc: "Core market intelligence — TAM/SAM/SOM, competitive landscape, growth forecast" },
  professional: { price: 9900,  name: "Professional Report",  desc: "Deep market analysis — full competitive matrix, regulatory landscape, 5-year forecast" },
  strategic:    { price: 19900, name: "Strategic Report",     desc: "Executive intelligence — comprehensive analysis with strategic recommendations and action plan" },
};

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "POST required" }), { status: 405, headers });

  const STRIPE_KEY = process.env["STRIPE_SECRET_KEY"];
  if (!STRIPE_KEY) return new Response(JSON.stringify({ error: "Payment not configured" }), { status: 500, headers });

  try {
    const body = await req.json();
    const { name, email, business, geo, context: marketContext, tier, market } = body;

    if (!email || !tier) {
      return new Response(JSON.stringify({ error: "email and tier required" }), { status: 400, headers });
    }

    const selected = TIERS[tier];
    if (!selected) {
      return new Response(JSON.stringify({ error: "Invalid tier", valid: Object.keys(TIERS) }), { status: 400, headers });
    }

    const params = new URLSearchParams({
      "payment_method_types[0]": "card",
      "line_items[0][price_data][currency]": "usd",
      "line_items[0][price_data][product_data][name]": `ORACLE ${selected.name}`,
      "line_items[0][price_data][product_data][description]": selected.desc,
      "line_items[0][price_data][unit_amount]": selected.price.toString(),
      "line_items[0][quantity]": "1",
      mode: "payment",
      success_url: `https://oracle-intelligence.netlify.app/success.html?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `https://oracle-intelligence.netlify.app/?cancelled=true`,
      customer_email: email,
      "metadata[tier]": tier,
      "metadata[market]": market || business || "",
      "metadata[name]": name || "",
      "metadata[geo]": geo || "",
      "metadata[context]": (marketContext || "").slice(0, 500),
      "metadata[platform]": "oracle",
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { Authorization: `Bearer ${STRIPE_KEY}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const session = await stripeRes.json();
    if (session.error) {
      return new Response(JSON.stringify({ error: session.error.message }), { status: 400, headers });
    }

    // Store order for tracking
    try {
      const store = getStore("orders");
      await store.set(`order_${session.id}`, JSON.stringify({
        sessionId: session.id, tier, email, name, market: market || business,
        geo, amount: selected.price, created: new Date().toISOString(),
      }));
    } catch {}

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), { status: 200, headers });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers });
  }
};

export const config = { path: "/api/create-checkout" };
