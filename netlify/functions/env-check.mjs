
export default async (req) => {
  const vars = ["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","RESEND_API_KEY","ADMIN_KEY","GROQ_API_KEY","SERPER_API_KEY","URL"];
  const check = {};
  for (const v of vars) {
    const val = process.env[v] || process.env[v] || "";
    check[v] = { via_netlify_env: val ? val.slice(0,10)+"..." : "", via_process_env: val ? val.slice(0,10)+"..." : "", available: !!val };
  }
  return Response.json({ timestamp: new Date().toISOString(), env_check: check }, { headers: { "Content-Type": "application/json" } });
};
export const config = { path: "/api/env-check" };
