"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Icon } from "@astryxdesign/core/Icon";
import PageHeader from "../../components/PageHeader";
import ArticleBody from "../../components/ArticleBody";
import { BriefcaseIcon, SparklesIcon } from "../../lib/icons";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function JobsClient() {
  const router = useRouter();
  const [jobs, setJobs] = useState(null);
  const [user, setUser] = useState(null);
  const [posting, setPosting] = useState(false);
  const [form, setForm] = useState({ title: "", company: "", location: "", job_type: "Full-time", description: "", how_to_apply: "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data }) => setUser(data?.user || null));
    sb.from("jobs").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setJobs(data || []));
  }, []);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function post() {
    setErr("");
    if (!form.title || !form.company || form.description.length < 60 || !form.how_to_apply) {
      setErr("Fill in the title, company, a real description (60+ characters), and how to apply.");
      return;
    }
    if (form.title.length > 150 || form.company.length > 150 || form.location.length > 150 ||
        form.job_type.length > 50 || form.description.length > 8000 || form.how_to_apply.length > 500) {
      setErr("One of those fields is too long — trim it down and try again.");
      return;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const { data, error } = await sb.from("jobs")
      .insert({ ...form, user_id: user.id })
      .select().single();
    setBusy(false);
    if (error) { setErr("Could not post. Try again."); return; }
    setJobs((j) => [data, ...(j || [])]);
    setPosting(false);
    setForm({ title: "", company: "", location: "", job_type: "Full-time", description: "", how_to_apply: "" });
  }

  return (
    <Layout
      height="auto"
      contentWidth={900}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <PageHeader
              eyebrow="Jobs board"
              title="Jobs in Kenya"
              description="Hiring? Post here for free. Job seekers: open any job, then generate a CV matched to it in one click."
              actions={
                user ? (
                  <Button label={posting ? "Close" : "Post a job — free"} variant={posting ? "ghost" : "primary"} onClick={() => setPosting(!posting)} />
                ) : (
                  <Button label="Sign in to post a job — free" variant="primary" onClick={() => router.push("/login")} />
                )
              }
            />

            {posting && (
              <Card padding={6}>
                <VStack gap={4}>
                  <Grid columns={{ minWidth: 240 }} gap={3}>
                    <TextInput label="Job title" value={form.title} onChange={(v) => set("title", v.slice(0, 150))} placeholder="e.g. Sales Executive" />
                    <TextInput label="Company" value={form.company} onChange={(v) => set("company", v.slice(0, 150))} placeholder="e.g. Acme Ltd" />
                    <TextInput label="Location" value={form.location} onChange={(v) => set("location", v.slice(0, 150))} placeholder="e.g. Nairobi / Remote" />
                    <TextInput label="Type" value={form.job_type} onChange={(v) => set("job_type", v.slice(0, 50))} placeholder="Full-time / Part-time / Gig" />
                  </Grid>
                  <TextArea label="Description & requirements" rows={8} maxLength={8000} value={form.description} onChange={(v) => set("description", v)} placeholder="Responsibilities, requirements, salary range if you can share it…" />
                  <TextInput label="How to apply" value={form.how_to_apply} onChange={(v) => set("how_to_apply", v.slice(0, 500))} placeholder="Email, phone, or application link" />
                  {err && <Banner status="error" title={err} />}
                  <HStack>
                    <Button label="Publish job" variant="primary" isLoading={busy} onClick={post} />
                  </HStack>
                </VStack>
              </Card>
            )}

            {jobs === null ? (
              <Center minHeight={200}><Spinner /></Center>
            ) : jobs.length === 0 ? (
              <EmptyState icon={<Icon icon={BriefcaseIcon} size="lg" />} title="No jobs posted yet" description="Be the first — posting is free." />
            ) : (
              <Card padding={2}>
                <CollapsibleGroup hasDividers>
                  {jobs.map((j) => (
                    <Collapsible
                      key={j.id}
                      value={j.id}
                      trigger={
                        <VStack gap={0}>
                          <Text weight="semibold">{j.title}</Text>
                          <Text type="supporting" color="secondary">
                            {j.company}{j.location ? ` · ${j.location}` : ""}{j.job_type ? ` · ${j.job_type}` : ""} ·{" "}
                            {new Date(j.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                          </Text>
                        </VStack>
                      }
                    >
                      <VStack gap={4}>
                        <ArticleBody content={j.description} />
                        <Text><Text weight="semibold">How to apply:</Text> {j.how_to_apply}</Text>
                        <HStack>
                          <Button label="Tailor my CV for this job" variant="primary" icon={<Icon icon={SparklesIcon} />} onClick={() => router.push(`/?jobid=${j.id}`)} />
                        </HStack>
                      </VStack>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Card>
            )}
          </VStack>
        </LayoutContent>
      }
    />
  );
}
