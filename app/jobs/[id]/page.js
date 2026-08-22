import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Nav from "../../../components/Nav";
import { safeJsonLd } from "../../../lib/jsonLd";

function supabasePublic() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

async function getJob(id) {
  const { data } = await supabasePublic().from("jobs").select("*").eq("id", id).single();
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: "Job not found — TumaCV" };
  const description = `${job.title} at ${job.company}${job.location ? `, ${job.location}` : ""}. ${job.description?.slice(0, 120)}…`;
  return {
    title: `${job.title} at ${job.company} — TumaCV Jobs`,
    description,
    openGraph: { title: `${job.title} at ${job.company}`, description, type: "website" },
  };
}

export default async function JobPage({ params }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return (
      <main className="shell">
        <Nav />
        <div className="step">
          <h1>Job not found</h1>
          <p className="step-hint">It may have been filled or removed. <Link href="/jobs">Browse all jobs →</Link></p>
        </div>
      </main>
    );
  }

  // JobPosting schema — this is what makes a listing eligible to appear in
  // Google's dedicated job search feature, not just regular web results.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted: job.created_at,
    hiringOrganization: { "@type": "Organization", name: job.company },
    employmentType: job.job_type ? job.job_type.toUpperCase().replace(/[\s-]+/g, "_") : undefined,
    jobLocation: job.location
      ? { "@type": "Place", address: { "@type": "PostalAddress", addressLocality: job.location, addressCountry: "KE" } }
      : undefined,
    directApply: true,
  };

  return (
    <main className="shell">
      <Nav />
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <section className="hero hero-band hero-band-compact">
        <div className="results-head">
          <Link href="/jobs" className="btn-ghost" style={{ textDecoration: "none" }}>← All jobs</Link>
        </div>
        <h1 className="news-reader-title">{job.title}</h1>
        <div className="job-meta">
          {job.company}{job.location ? ` · ${job.location}` : ""}{job.job_type ? ` · ${job.job_type}` : ""} ·{" "}
          {new Date(job.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </section>
      <div className="step">
        <p style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.6 }}>{job.description}</p>
        <p className="job-apply" style={{ marginTop: 16 }}><b>How to apply:</b> {job.how_to_apply}</p>
        <Link href={`/?jobid=${job.id}`} className="btn-primary" style={{ textDecoration: "none", display: "inline-block", marginTop: 16 }}>
          Tailor my CV for this job
        </Link>
      </div>
    </main>
  );
}
