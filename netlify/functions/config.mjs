
export default async (req) => {
  return Response.json({
    stripe_publishable_key: process.env["STRIPE_PUBLISHABLE_KEY"] || "",
    site_url: "https://oracle-intelligence.netlify.app",
  });
};
export const config = { path: "/api/config" };
