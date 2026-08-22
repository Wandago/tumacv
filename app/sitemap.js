import { createClient } from "@supabase/supabase-js";

function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export default async function sitemap() {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://tumacv.vercel.app";

  // The jobs board is hidden for now, so /jobs stays out of the sitemap.
  const staticRoutes = ["", "/pricing", "/hub", "/news", "/support", "/login"].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
  }));

  // Dynamic entries are a bonus, not a requirement — a Supabase hiccup during
  // build should never be able to fail the entire site's deployment just
  // because the sitemap couldn't fetch article IDs.
  try {
    const sb = supabasePublic();
    const { data: articles } = await sb.from("articles").select("id, created_at").limit(1000);
    const articleRoutes = (articles || []).map((a) => ({ url: `${base}/news/${a.id}`, lastModified: a.created_at }));
    return [...staticRoutes, ...articleRoutes];
  } catch (err) {
    console.error("Sitemap: could not fetch dynamic routes, falling back to static only:", err);
    return staticRoutes;
  }
}
