"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Icon } from "@astryxdesign/core/Icon";
import { Table } from "@astryxdesign/core/Table";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { Link } from "@astryxdesign/core/Link";
import CountUp from "../CountUp";
import CvSheet from "./CvSheet";
import { SAMPLE_CV } from "../../lib/sampleCv";
import { TEMPLATES } from "../../lib/templates";
import { FREE_MODE, FREE_SIGNUP_CREDITS } from "../../lib/plans";
import { setPendingJob } from "../../lib/storage";
import { ArrowRightIcon, FileTextIcon, SparklesIcon, TargetIcon } from "../../lib/icons";

// Columns: one generic CV · hiring a CV writer · TumaCV. Kept deliberately
// even-handed — a good CV writer genuinely beats us on human judgement.
const COMPARISON = [
  { label: "Rewritten for the specific job", cells: [false, true, true] },
  { label: "Ready in", cells: ["—", "2–5 days", "About a minute"] },
  { label: "Matching cover letter", cells: [false, "Usually extra", true] },
  { label: "Shows what the job wants that you're missing", cells: [false, false, true] },
  // Basic works out at KES 2.00/application, Pro at KES 0.71 — so "2 or less".
  { label: "Typical cost per application", cells: ["Free", "~KES 2,000+", "KES 2 or less"] },
  { label: "Uses only your real experience", cells: [true, true, true] },
  { label: "Human judgement on your career story", cells: [false, true, false] },
];

const FAQS = [
  {
    q: "Does it make up experience I don't have?",
    a: "No. TumaCV only reorders, rewords and re-emphasises what you already gave it. If the job asks for something you haven't done, it tells you it's missing rather than inventing it — that's what the match score is for.",
  },
  {
    q: "Will employers be able to tell I used AI?",
    a: "There's nothing to tell. The words describe your real jobs and your real results — the same facts you'd have written yourself, arranged to answer this particular posting. You can edit everything before you send it.",
  },
  {
    q: "Why can't it read LinkedIn job links?",
    a: "LinkedIn blocks automated reading for every outside tool, not just us. Open the posting, copy the description text, and paste it in — it works exactly the same from there.",
  },
  {
    q: "What do I get for free?",
    a: `${FREE_SIGNUP_CREDITS} full applications when you sign up — CV and cover letter both — with no card required. You only pay if you want more.`,
  },
  {
    q: "How do I pay?",
    a: "M-Pesa, Airtel Money, or card. Top-ups are one-off — there's no subscription and nothing renews on you.",
  },
  {
    q: "Who can see my CV?",
    a: "Only you. Your applications are private to your account. Nothing is shared publicly unless you deliberately opt in to the Talent Hub.",
  },
  {
    q: "What can I download?",
    a: "PDF for anything you're emailing or uploading, and .docx if you want to keep editing in Word. Both keep the template's formatting.",
  },
];

const STEPS = [
  {
    icon: FileTextIcon,
    title: "Paste a job",
    body: "A link from BrighterMonday, Fuzu, MyJobMag or a company careers page — or the description text. Any posting, any board.",
  },
  {
    icon: SparklesIcon,
    title: "We tailor your CV",
    body: "Keywords, ordering and emphasis rewritten to match the job — from your real experience only. Nothing invented.",
  },
  {
    icon: TargetIcon,
    title: "Check the fit, then send",
    body: "See your match score and what's missing, then download the CV and matching cover letter as PDF or Word.",
  },
];

function Cell({ value }) {
  if (value === true) return <Icon icon="check" color="success" label="Yes" />;
  if (value === false) return <Text color="secondary" aria-label="No">—</Text>;
  return <Text>{value}</Text>;
}

function SectionHeading({ eyebrow, title, sub }) {
  return (
    <VStack gap={2} hAlign="center">
      <Text color="accent" weight="semibold" justify="center">{eyebrow}</Text>
      <Heading level={2} type="display-3" justify="center" textWrap="balance">{title}</Heading>
      {sub && <Text color="secondary" justify="center" textWrap="balance">{sub}</Text>}
    </VStack>
  );
}

export default function Landing({ publicStats }) {
  const router = useRouter();
  const [heroInput, setHeroInput] = useState("");
  const [exampleTemplate, setExampleTemplate] = useState("modern");

  function startWithJob() {
    const v = heroInput.trim();
    if (v) {
      if (/^https?:\/\//i.test(v)) setPendingJob({ url: v });
      else setPendingJob({ text: v });
    }
    router.push("/login?mode=signup");
  }

  const freeLine = FREE_MODE
    ? "Free during beta — create an account and generate as many as you like."
    : `${FREE_SIGNUP_CREDITS} free applications when you sign up — no card required.`;

  const stats = [
    publicStats?.totalUsers > 0
      ? { label: "Kenyan job seekers", value: <CountUp value={publicStats.totalUsers} suffix="+" /> }
      : { label: "To get started", value: `${FREE_SIGNUP_CREDITS} free` },
    {
      label: "Applications tailored",
      value: publicStats?.totalGenerations > 0 ? <CountUp value={publicStats.totalGenerations} suffix="+" /> : "Just launched",
    },
    { label: "CV styles", value: TEMPLATES.length },
    { label: "Job to ready CV", value: "~1 min" },
  ];

  return (
    <Layout
      height="auto"
      contentWidth={1120}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={10}>
            {/* Hero: the pitch and a way in on the left, real output on the right. */}
            <Grid columns={{ minWidth: 340 }} gap={8} align="center">
              <VStack gap={5}>
                <HStack>
                  <Token label="Built for Kenyan job seekers" color="green" />
                </HStack>
                <Heading level={1} type="display-1" textWrap="balance">
                  One job. One tailored CV.
                </Heading>
                <Text type="large" color="secondary" textWrap="pretty">
                  Paste any job posting. TumaCV rewrites your CV and cover letter to match it — keywords, ordering,
                  emphasis — using only your real experience. Nothing invented.
                </Text>
                <HStack gap={2} align="end">
                  <StackItem size="fill">
                    <TextInput
                      label="Job link or description"
                      isLabelHidden
                      size="lg"
                      placeholder="Paste a job link or description"
                      value={heroInput}
                      onChange={setHeroInput}
                    />
                  </StackItem>
                  <Button label="Start free" variant="primary" size="lg" endContent={<Icon icon={ArrowRightIcon} />} onClick={startWithJob} />
                </HStack>
                <Text type="supporting" color="secondary">{freeLine}</Text>
                <HStack gap={2}>
                  <Button
                    label="See a real CV"
                    variant="ghost"
                    onClick={() => document.getElementById("example")?.scrollIntoView({ behavior: "smooth" })}
                  />
                  <Button label="Pricing" variant="ghost" onClick={() => router.push("/pricing")} />
                </HStack>
              </VStack>
              <Card padding={0} elevation="high" className="preview-card">
                <CvSheet>
                  <CvSheet.Cv data={SAMPLE_CV} template="modern" />
                </CvSheet>
              </Card>
            </Grid>

            <Grid columns={{ minWidth: 200 }} gap={4}>
              {stats.map((s) => (
                <Card key={s.label} padding={5} variant={s.label === "Applications tailored" ? "green" : "default"}>
                  <VStack gap={1}>
                    <Text type="supporting" color="secondary">{s.label}</Text>
                    <Heading level={3} type="display-3">{s.value}</Heading>
                  </VStack>
                </Card>
              ))}
            </Grid>

            <VStack gap={6}>
              <SectionHeading
                eyebrow="How it works"
                title="Three steps, zero guesswork"
                sub="Paste a job, add your CV once, and get a tailored application in about a minute."
              />
              <Grid columns={{ minWidth: 260 }} gap={4}>
                {STEPS.map((s, i) => (
                  <Card key={s.title} padding={6}>
                    <VStack gap={3}>
                      <HStack gap={2} align="center">
                        <Icon icon={s.icon} color="accent" size="lg" />
                        <Text color="secondary" weight="semibold">Step {i + 1}</Text>
                      </HStack>
                      <Heading level={3}>{s.title}</Heading>
                      <Text color="secondary">{s.body}</Text>
                    </VStack>
                  </Card>
                ))}
              </Grid>
            </VStack>

            <VStack gap={6} id="example">
              <SectionHeading
                eyebrow="Real output, not a mockup"
                title="See what you get"
                sub="Every style below is the actual template, rendered live with example data — the same component every real CV goes through."
              />
              <HStack justify="center">
                <SegmentedControl label="CV style" value={exampleTemplate} onChange={setExampleTemplate}>
                  {TEMPLATES.map((t) => (
                    <SegmentedControlItem key={t.id} value={t.id} label={t.name} />
                  ))}
                </SegmentedControl>
              </HStack>
              <Card padding={0} elevation="med" className="preview-card preview-card-tall">
                <CvSheet>
                  <CvSheet.Cv data={SAMPLE_CV} template={exampleTemplate} />
                </CvSheet>
              </Card>
            </VStack>

            <VStack gap={6}>
              <SectionHeading eyebrow="The honest comparison" title="Three ways to send a CV" sub="What you actually get for your time and money." />
              <Card padding={0}>
                <Table
                  idKey="label"
                  data={COMPARISON}
                  columns={[
                    { key: "label", header: "What you get", renderCell: (r) => <Text weight="medium">{r.label}</Text> },
                    { key: "generic", header: "One CV for everything", renderCell: (r) => <Cell value={r.cells[0]} /> },
                    { key: "writer", header: "Hiring a CV writer", renderCell: (r) => <Cell value={r.cells[1]} /> },
                    { key: "tumacv", header: "TumaCV", renderCell: (r) => <Cell value={r.cells[2]} /> },
                  ]}
                />
              </Card>
            </VStack>

            <VStack gap={6}>
              <SectionHeading eyebrow="Before you start" title="Questions people actually ask" />
              <Card padding={2}>
                <CollapsibleGroup hasDividers>
                  {FAQS.map((f) => (
                    <Collapsible key={f.q} value={f.q} trigger={<Text weight="semibold">{f.q}</Text>}>
                      <Text color="secondary">{f.a}</Text>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Card>
            </VStack>

            <Card variant="green" padding={8}>
              <VStack gap={4} hAlign="center">
                <Heading level={2} type="display-3" justify="center" textWrap="balance">
                  Your next application deserves better than a copy-paste.
                </Heading>
                <Text justify="center" textWrap="balance">
                  Tailor it to the job in about a minute — {FREE_SIGNUP_CREDITS} free applications when you sign up, no card required.
                </Text>
                <Button label="Start free" variant="primary" size="lg" endContent={<Icon icon={ArrowRightIcon} />} onClick={() => router.push("/login?mode=signup")} />
                <Text type="supporting" color="secondary">
                  Already have an account? <Link href="/login">Sign in</Link>
                </Text>
              </VStack>
            </Card>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
