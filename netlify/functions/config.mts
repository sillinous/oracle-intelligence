import type { Config } from "@netlify/functions";
export default async (req: Request) => {
  return Response.json({
    stripe_publishable_key: Netlify.env.get("STRIPE_PUBLISHABLE_KEY") || "",
    site_url: "https://oracle-intelligence.netlify.app",
  });
};
export const config: Config = { path: "/api/config" };
