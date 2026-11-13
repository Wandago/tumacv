import { createClient } from "@supabase/supabase-js";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Link } from "@astryxdesign/core/Link";
import { Card } from "@astryxdesign/core/Card";
import ArticleBody from "../../../components/ArticleBody";
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
      <Layout
        height="auto"
        contentWidth={680}
        content={
          <LayoutContent padding={6} isScrollable={false}>
            <VStack gap={2}>
              <Heading level={1}>Job not found</Heading>
              <Text color="secondary">It may have been filled or removed. <Link href="/jobs">Browse all jobs →</Link></Text>
            </VStack>
          </LayoutContent>
        }
      />
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
    <Layout
      height="auto"
      contentWidth={720}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          {/* eslint-disable-next-line react/no-danger */}
          <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
          <VStack gap={6}>
            <Link href="/jobs">← All jobs</Link>
            <VStack gap={2}>
              <Heading level={1} type="display-3" textWrap="balance">{job.title}</Heading>
              <Text color="secondary">
                {job.company}{job.location ? ` · ${job.location}` : ""}{job.job_type ? ` · ${job.job_type}` : ""} ·{" "}
                {new Date(job.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
              </Text>
            </VStack>
            <ArticleBody content={job.description} />
            <Card variant="muted" padding={5}>
              <VStack gap={2}>
                <Text><Text weight="semibold">How to apply:</Text> {job.how_to_apply}</Text>
                <Link href={`/?jobid=${job.id}`}>Tailor my CV for this job →</Link>
              </VStack>
            </Card>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
