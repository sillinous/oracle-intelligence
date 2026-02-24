import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  const vars = ["STRIPE_SECRET_KEY","STRIPE_WEBHOOK_SECRET","RESEND_API_KEY","ADMIN_KEY","ANTHROPIC_API_KEY","SERPER_API_KEY","OPENROUTER_API_KEY","URL"];
  const check: Record<string,any> = {};
  for (const v of vars) {
    const val = Netlify.env.get(v) || process.env[v] || "";
    check[v] = { via_netlify_env: val ? val.slice(0,10)+"..." : "", via_process_env: val ? val.slice(0,10)+"..." : "", available: !!val };
  }
  return Response.json({ timestamp: new Date().toISOString(), env_check: check }, { headers: { "Content-Type": "application/json" } });
};
export const config: Config = { path: "/api/env-check" };
