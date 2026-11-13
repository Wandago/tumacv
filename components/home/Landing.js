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
import { Avatar } from "@astryxdesign/core/Avatar";
import { List, ListItem } from "@astryxdesign/core/List";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import { Link } from "@astryxdesign/core/Link";
import CountUp from "../CountUp";
import CvSheet from "./CvSheet";
import Tile from "../brand/Tile";
import Accent from "../brand/Accent";
import Reveal from "../brand/Reveal";
import Marquee from "../brand/Marquee";
import StepPills from "../brand/StepPills";
import {
  CvIllustration,
  JobSearchIllustration,
  PaperPlaneIllustration,
  StopwatchIllustration,
  TargetIllustration,
  WaveIllustration,
} from "../brand/Illustration";
import { SAMPLE_CV } from "../../lib/sampleCv";
import { TEMPLATES } from "../../lib/templates";
import { FREE_MODE, FREE_SIGNUP_CREDITS } from "../../lib/plans";
import { setPendingJob } from "../../lib/storage";
import { ArrowRightIcon, BriefcaseIcon, SparklesIcon } from "../../lib/icons";

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
    q: "Where do the jobs come from?",
    a: "Live listings from job boards across the web — Kenyan roles and remote roles open to applicants in Kenya — plus jobs employers post on TumaCV. Every listing links back to where it was posted, and you apply there.",
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
    a: "A print-ready PDF for anything you're emailing or uploading, and a Word file if you want to keep editing.",
  },
];

const STEPS = [
  {
    tone: "magenta",
    Illustration: JobSearchIllustration,
    title: "Paste a job, or pick one",
    body: "A link from BrighterMonday, Fuzu, MyJobMag or a careers page — or tap any listing on our live jobs page.",
  },
  {
    tone: "sunshine",
    Illustration: CvIllustration,
    title: "We tailor your CV",
    body: "Keywords, ordering and emphasis rewritten for that job, from your real experience only. Plus a cover letter to match.",
  },
  {
    tone: "plum",
    Illustration: PaperPlaneIllustration,
    title: "Check the fit. Send it.",
    body: "See your match score and what's missing, save the PDF, and apply — your tracker remembers every application.",
  },
];

const BOARDS = ["BrighterMonday", "Fuzu", "MyJobMag", "LinkedIn", "Indeed", "Company careers pages", "Himalayas", "Remotive", "TumaCV Jobs"];

const EXAMPLE_JOBS = [
  { title: "Sales Executive", where: "FMCG distributor · Nairobi · Full-time" },
  { title: "Customer Success Associate", where: "Fintech · Remote, open to Kenya" },
  { title: "Graduate Trainee, Finance", where: "Bank · Nairobi · 2 days ago" },
];

function Cell({ value }) {
  if (value === true) return <Icon icon="check" color="accent" label="Yes" />;
  if (value === false) return <Text color="secondary" aria-label="No">—</Text>;
  return <Text>{value}</Text>;
}

function SectionHeading({ eyebrow, children, sub, align = "center" }) {
  return (
    <VStack gap={3} hAlign={align}>
      <Text color="accent" weight="semibold" justify={align}>{eyebrow}</Text>
      <Heading level={2} type="display-1" justify={align} textWrap="balance">{children}</Heading>
      {sub && <Text type="large" color="secondary" justify={align} textWrap="balance">{sub}</Text>}
    </VStack>
  );
}

export default function Landing({ publicStats }) {
  const router = useRouter();
  const [heroInput, setHeroInput] = useState("");
  const [design, setDesign] = useState("nairobi");

  function startWithJob() {
    const v = heroInput.trim();
    if (v) {
      if (/^https?:\/\//i.test(v)) setPendingJob({ url: v });
      else setPendingJob({ text: v });
    }
    router.push("/login?mode=signup");
  }

  const freeLine = FREE_MODE
    ? "Free during beta — no card needed."
    : `${FREE_SIGNUP_CREDITS} free applications · No card · Pay with M-Pesa or Airtel Money`;

  const stats = [
    publicStats?.totalUsers > 0
      ? { label: "Kenyan job seekers", value: <CountUp value={publicStats.totalUsers} suffix="+" /> }
      : { label: "Free applications to start", value: FREE_SIGNUP_CREDITS },
    {
      label: "Applications tailored",
      value: publicStats?.totalGenerations > 0 ? <CountUp value={publicStats.totalGenerations} suffix="+" /> : "New",
    },
    { label: "CV designs", value: TEMPLATES.length },
    { label: "From job post to ready CV", value: "~1 min" },
  ];

  return (
    <Layout
      height="auto"
      contentWidth={1180}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={10}>
            {/* Hero */}
            <Grid columns={{ minWidth: 360 }} gap={10} align="center">
              <VStack gap={6} paddingBlock={6}>
                <HStack>
                  <Token label="New · One-tap apply to live jobs" color="pink" />
                </HStack>
                <Heading level={1} type="display-1" textWrap="balance">
                  One job. One <Accent>tailored</Accent> CV. One tap.
                </Heading>
                <Text type="large" color="secondary" textWrap="pretty">
                  Paste any job posting — or pick one from our live jobs. TumaCV rewrites your CV and cover letter to
                  match it, using only your real experience. Nothing invented.
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
              </VStack>

              <VStack gap={3}>
                <Tile tone="magenta" padding={6}>
                  <VStack gap={4}>
                    <HStack justify="between" align="center" gap={2} wrap="wrap">
                      <Text weight="semibold">Sales Executive · Unilever Kenya</Text>
                      <Token label="Tailored in 58s" color="yellow" />
                    </HStack>
                    <VStack className="preview-card">
                      <CvSheet>
                        <CvSheet.Cv data={SAMPLE_CV} template="savannah" />
                      </CvSheet>
                    </VStack>
                  </VStack>
                </Tile>
                <Grid columns={{ minWidth: 200 }} gap={3}>
                  <Tile tone="sunshine" padding={5}>
                    <HStack justify="between" align="center" gap={2}>
                      <VStack gap={0}>
                        <Text color="secondary" weight="semibold">Match</Text>
                        <Heading level={3} type="display-2">92%</Heading>
                      </VStack>
                      <TargetIllustration size={64} hideOnPhones />
                    </HStack>
                  </Tile>
                  <Tile tone="plum" padding={5}>
                    <HStack justify="between" align="center" gap={2}>
                      <VStack gap={0}>
                        <Text color="secondary" weight="semibold">Cover letter</Text>
                        <Heading level={3} type="display-3">Written</Heading>
                      </VStack>
                      <StopwatchIllustration size={60} hideOnPhones />
                    </HStack>
                  </Tile>
                </Grid>
              </VStack>
            </Grid>

            <VStack gap={3}>
              <Text type="supporting" color="secondary" justify="center" weight="semibold">Works with any posting from</Text>
              <Marquee items={BOARDS} label="Works with BrighterMonday, Fuzu, MyJobMag, LinkedIn, Indeed, company careers pages, Himalayas, Remotive and TumaCV Jobs" />
            </VStack>

            {/* How it works */}
            <Reveal gap={8}>
              <SectionHeading eyebrow="How it works" sub="Add your CV once. After that, every application takes about a minute.">
                From job post to <Accent>sent</Accent> in three taps
              </SectionHeading>
              <Grid columns={{ minWidth: 300 }} gap={4}>
                {STEPS.map((s, i) => (
                  <Tile key={s.title} tone={s.tone} padding={8} minHeight={460} interactive>
                    <VStack gap={3} height="100%">
                      <StepPills total={STEPS.length} current={i} />
                      <Text color="secondary" weight="semibold">Step {i + 1}</Text>
                      <Heading level={3} type="display-3" textWrap="balance">{s.title}</Heading>
                      <Text color="secondary" textWrap="pretty">{s.body}</Text>
                      <StackItem size="fill" />
                      <HStack justify="end">
                        <s.Illustration size={180} float />
                      </HStack>
                    </VStack>
                  </Tile>
                ))}
              </Grid>
            </Reveal>

            {/* Numbers */}
            <Reveal>
              <Grid columns={{ minWidth: 220 }} gap={6}>
                {stats.map((s) => (
                  <VStack key={s.label} gap={1} paddingBlock={4}>
                    <Heading level={3} type="display-1">{s.value}</Heading>
                    <Text color="secondary">{s.label}</Text>
                  </VStack>
                ))}
              </Grid>
            </Reveal>

            {/* Jobs */}
            <Reveal>
              <Grid columns={{ minWidth: 360 }} gap={10} align="center">
                <VStack gap={5}>
                  <SectionHeading align="start" eyebrow="Jobs" sub="Live jobs in Kenya and remote roles open to Kenyans, in one list. Tap one and TumaCV tailors your CV and cover letter, saves it to your tracker, and takes you to the apply page.">
                    Live jobs. <Accent>One tap</Accent> to apply.
                  </SectionHeading>
                  <HStack gap={2} wrap="wrap">
                    <Button label="Browse jobs" variant="primary" size="lg" icon={<Icon icon={BriefcaseIcon} />} href="/jobs" />
                    <Button label="Start free" variant="ghost" size="lg" onClick={() => router.push("/login?mode=signup")} />
                  </HStack>
                </VStack>
                <Tile tone="peach" padding={6}>
                  <VStack gap={4}>
                    <HStack justify="between" align="center">
                      <Text weight="semibold">Jobs for a sales profile</Text>
                      <JobSearchIllustration size={72} />
                    </HStack>
                    <List hasDividers>
                      {EXAMPLE_JOBS.map((j) => (
                        <ListItem
                          key={j.title}
                          label={j.title}
                          description={j.where}
                          startContent={<Avatar name={j.title} size="md" tooltip={false} />}
                          endContent={<Button label="Tailor & apply" size="sm" variant="primary" icon={<Icon icon={SparklesIcon} />} href="/jobs" />}
                        />
                      ))}
                    </List>
                    <Text type="supporting" color="secondary">Examples. Live listings are on the jobs page.</Text>
                  </VStack>
                </Tile>
              </Grid>
            </Reveal>

            {/* CV designs */}
            <Reveal>
              <Tile tone="lilac" padding={10}>
                <VStack gap={8}>
                  <SectionHeading eyebrow="Real output, not a mockup" sub="Every design below is rendered live with example data — the same component every real CV goes through. Switch any time; the words stay the same.">
                    {TEMPLATES.length} fresh designs. <Accent>All yours.</Accent>
                  </SectionHeading>
                  <HStack gap={2} wrap="wrap" justify="center">
                    {TEMPLATES.map((t) => (
                      <Button key={t.id} label={t.name} size="sm" variant={design === t.id ? "primary" : "secondary"} onClick={() => setDesign(t.id)} />
                    ))}
                  </HStack>
                  <Text justify="center" color="secondary">{TEMPLATES.find((t) => t.id === design)?.desc}</Text>
                  <VStack className="preview-card preview-card-tall">
                    <CvSheet>
                      <CvSheet.Cv data={SAMPLE_CV} template={design} />
                    </CvSheet>
                  </VStack>
                </VStack>
              </Tile>
            </Reveal>

            {/* Comparison */}
            <Reveal gap={8}>
              <SectionHeading eyebrow="The honest comparison" sub="What you actually get for your time and money.">
                Three ways to send a CV
              </SectionHeading>
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
            </Reveal>

            {/* FAQ */}
            <Reveal gap={8}>
              <SectionHeading eyebrow="Before you start">Questions people actually ask</SectionHeading>
              <Card padding={3}>
                <CollapsibleGroup hasDividers>
                  {FAQS.map((f) => (
                    <Collapsible key={f.q} value={f.q} trigger={<Text weight="semibold" size="lg">{f.q}</Text>}>
                      <Text color="secondary">{f.a}</Text>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Card>
            </Reveal>

            {/* Close */}
            <Reveal>
              <Tile tone="magenta" padding={10}>
                <VStack gap={5} hAlign="center">
                  <WaveIllustration size={160} float />
                  <Heading level={2} type="display-1" justify="center" textWrap="balance">
                    Your next job is <Accent>one tap</Accent> away.
                  </Heading>
                  <Text type="large" justify="center" color="secondary" textWrap="balance">
                    Tailor it to the job in about a minute — {FREE_SIGNUP_CREDITS} free applications when you sign up, no card required.
                  </Text>
                  <HStack gap={2} wrap="wrap" justify="center">
                    <Button label="Start free" variant="primary" size="lg" endContent={<Icon icon={ArrowRightIcon} />} onClick={() => router.push("/login?mode=signup")} />
                    <Button label="Browse jobs" variant="ghost" size="lg" href="/jobs" />
                  </HStack>
                  <Text color="secondary">
                    Already have an account? <Link href="/login">Sign in</Link>
                  </Text>
                </VStack>
              </Tile>
            </Reveal>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
