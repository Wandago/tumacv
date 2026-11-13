import { createClient } from "@supabase/supabase-js";
import { himalayas, remotive, jsearch, jsearchEnabled, tumacvPosts, mergeJobs } from "../../../lib/jobFeeds";

export const maxDuration = 20;

// GET /api/jobs?q=sales&scope=all|kenya|remote
// Public on purpose: browsing jobs needs no account (Remotive's terms forbid
// gating its listings behind a sign-up). Each source is fetched in parallel
// and cached (lib/jobFeeds.js); a source that's down is reported, not fatal.
export async function GET(req) {
  const params = new URL(req.url).searchParams;
  const q = (params.get("q") || "").replace(/\s+/g, " ").trim().slice(0, 80);
  const scope = ["all", "kenya", "remote"].includes(params.get("scope")) ? params.get("scope") : "all";

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const sources = [];
  if (scope !== "remote") {
    sources.push(["TumaCV", () => tumacvPosts(q, supabase)]);
    if (jsearchEnabled()) sources.push(["Kenyan job boards", () => jsearch(q)]);
  }
  if (scope !== "kenya") {
    sources.push(["Himalayas", () => himalayas(q)]);
    sources.push(["Remotive", () => remotive(q)]);
  }

  const settled = await Promise.allSettled(sources.map(([, run]) => run()));
  const report = settled.map((r, i) => ({
    name: sources[i][0],
    ok: r.status === "fulfilled",
    count: r.status === "fulfilled" ? r.value.length : 0,
  }));
  settled.forEach((r, i) => {
    if (r.status === "rejected") console.error(`jobs: ${sources[i][0]} failed:`, r.reason?.message || r.reason);
  });

  const jobs = mergeJobs(settled.filter((r) => r.status === "fulfilled").map((r) => r.value)).slice(0, 80);

  return Response.json(
    { jobs, sources: report, localJobsEnabled: jsearchEnabled() },
    { headers: { "cache-control": "public, s-maxage=600, stale-while-revalidate=1800" } }
  );
}
