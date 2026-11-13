"use client";
import { useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FileInput } from "@astryxdesign/core/FileInput";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Divider } from "@astryxdesign/core/Divider";
import { Grid } from "@astryxdesign/core/Grid";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import { Icon } from "@astryxdesign/core/Icon";
import LinkedInGuide from "../LinkedInGuide";
import GenerationProgress from "./GenerationProgress";
import { TEMPLATES } from "../../lib/templates";
import { looksLikeBareLinkedInUrl } from "../../lib/linkedin";
import { ArrowRightIcon, SparklesIcon } from "../../lib/icons";

export const MIN_CHARS = 80;
const filled = (s) => s.trim().length >= MIN_CHARS;
const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);
const firstLine = (s) => {
  const line = s.trim().split("\n")[0];
  return line.length > 90 ? line.slice(0, 88) + "…" : line;
};

// Character-count feedback under each big text box, so it's obvious when
// there's enough for the AI to work with.
function lengthStatus(text, what) {
  const n = text.trim().length;
  if (n === 0) return undefined;
  if (n < MIN_CHARS) return { type: "warning", message: `A bit short — add more of the ${what} (${n}/${MIN_CHARS} characters).` };
  return { type: "success", message: `${words(text).toLocaleString()} words — good to go.` };
}

export default function Builder({
  jobUrl, setJobUrl, jobText, setJobText, fetchJd, fetching, fetchErr,
  profileText, setProfileText, profileWasSaved, onPdf, pdfBusy, pdfErr, onPhotos, photoBusy, photoErr,
  template, setTemplate, onGenerate, loading, genErr,
}) {
  const [step, setStep] = useState(filled(jobText) && filled(profileText) ? "style" : filled(jobText) ? "you" : "job");
  const jobOk = filled(jobText);
  const profileOk = filled(profileText);

  if (loading) {
    return (
      <Layout height="auto" contentWidth={720} content={<LayoutContent padding={6} isScrollable={false}><GenerationProgress /></LayoutContent>} />
    );
  }

  return (
    <Layout
      height="auto"
      contentWidth={760}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <VStack gap={1}>
              <Heading level={1}>Tailor your CV to a job</Heading>
              <Text color="secondary">
                Three quick steps. Everything is rewritten from your real experience — nothing invented.
              </Text>
            </VStack>

            <TabList value={step} onChange={setStep} layout="fill" hasDivider>
              <Tab value="job" label={jobOk ? "✓ The job" : "1 · The job"} />
              <Tab value="you" label={profileOk ? "✓ Your CV" : "2 · Your CV"} />
              <Tab value="style" label="3 · Style" />
            </TabList>

            {step === "job" && (
              <Card padding={6}>
                <VStack gap={5}>
                  <VStack gap={1}>
                    <Heading level={2}>Which job are you applying for?</Heading>
                    <Text color="secondary">
                      Paste a link from BrighterMonday, Fuzu, MyJobMag or a careers page — or paste the description itself.
                    </Text>
                  </VStack>
                  <HStack gap={2} align="end">
                    <StackItem size="fill">
                      <TextInput
                        label="Job link"
                        placeholder="https://www.brightermonday.co.ke/listings/…"
                        value={jobUrl}
                        onChange={setJobUrl}
                        hasClear
                      />
                    </StackItem>
                    <Button label="Read link" onClick={fetchJd} isLoading={fetching} isDisabled={!jobUrl} />
                  </HStack>
                  {fetchErr && <Banner status="warning" title="Couldn't read that link" description={fetchErr} />}
                  <Divider label="or paste it" />
                  <TextArea
                    label="Job description"
                    description="LinkedIn links can't be read automatically (LinkedIn blocks every outside tool) — copy the description text instead."
                    placeholder="Paste the full job description here…"
                    rows={10}
                    value={jobText}
                    onChange={setJobText}
                    status={lengthStatus(jobText, "job description")}
                  />
                  <HStack justify="end">
                    <Button
                      label="Continue"
                      variant="primary"
                      endContent={<Icon icon={ArrowRightIcon} />}
                      isDisabled={!jobOk}
                      onClick={() => setStep("you")}
                    />
                  </HStack>
                </VStack>
              </Card>
            )}

            {step === "you" && (
              <Card padding={6}>
                <VStack gap={5}>
                  <VStack gap={1}>
                    <Heading level={2}>Your experience</Heading>
                    <Text color="secondary">
                      Upload your LinkedIn PDF or a photo of your CV and we'll read it — or paste your CV text. Saved to
                      your account, so you only do this once.
                    </Text>
                  </VStack>
                  {profileWasSaved && profileOk && (
                    <Banner
                      status="success"
                      title="We kept your CV from last time"
                      description="Check it's still up to date, then continue."
                    />
                  )}
                  <Grid columns={{ minWidth: 240 }} gap={4}>
                    <FileInput
                      label="LinkedIn or CV PDF"
                      accept="application/pdf"
                      value={null}
                      onChange={(f) => f && onPdf(Array.isArray(f) ? f[0] : f)}
                      isLoading={pdfBusy}
                      placeholder="Choose a PDF"
                      status={pdfErr ? { type: "error", message: pdfErr } : undefined}
                    />
                    <FileInput
                      label="Photos of your CV"
                      description="Up to 4 — a printed CV or LinkedIn screenshots."
                      accept="image/*"
                      isMultiple
                      maxFiles={4}
                      value={null}
                      onChange={(f) => f && onPhotos(Array.isArray(f) ? f : [f])}
                      isLoading={photoBusy}
                      placeholder="Choose photos"
                      status={photoErr ? { type: "error", message: photoErr } : undefined}
                    />
                  </Grid>
                  <LinkedInGuide />
                  <TextArea
                    label="Your CV"
                    placeholder={"Jane Wanjiku\nNairobi · jane@email.com · +254 7...\n\nSales Assistant, Naivas — 2023 to now\n- Served 100+ customers daily...\n\nEducation: ..."}
                    rows={12}
                    value={profileText}
                    onChange={setProfileText}
                    status={
                      looksLikeBareLinkedInUrl(profileText)
                        ? { type: "error", message: "That's a LinkedIn link, not your profile content — LinkedIn won't let other sites read it. Save it as a PDF (steps above) and upload that." }
                        : lengthStatus(profileText, "your experience")
                    }
                  />
                  <HStack justify="between">
                    <Button label="Back" variant="ghost" onClick={() => setStep("job")} />
                    <Button
                      label="Continue"
                      variant="primary"
                      endContent={<Icon icon={ArrowRightIcon} />}
                      isDisabled={!profileOk}
                      onClick={() => setStep("style")}
                    />
                  </HStack>
                </VStack>
              </Card>
            )}

            {step === "style" && (
              <Card padding={6}>
                <VStack gap={5}>
                  <VStack gap={1}>
                    <Heading level={2}>Pick a style</Heading>
                    <Text color="secondary">You can switch styles after it's generated — the content stays the same.</Text>
                  </VStack>
                  <Grid columns={{ minWidth: 200 }} gap={3}>
                    {TEMPLATES.map((t) => (
                      <SelectableCard
                        key={t.id}
                        label={t.name}
                        isSelected={template === t.id}
                        onChange={() => setTemplate(t.id)}
                        padding={4}
                      >
                        <VStack gap={1}>
                          <Text weight="semibold">{t.name}</Text>
                          <Text type="supporting" color="secondary">{t.desc}</Text>
                        </VStack>
                      </SelectableCard>
                    ))}
                  </Grid>
                  <MetadataList title="Ready to go" label={{ position: "start", width: 96 }}>
                    <MetadataListItem label="Job">
                      <Text>{jobOk ? firstLine(jobText) : "Not added yet"}</Text>
                    </MetadataListItem>
                    <MetadataListItem label="Your CV">
                      <Text>{profileOk ? `${words(profileText).toLocaleString()} words` : "Not added yet"}</Text>
                    </MetadataListItem>
                  </MetadataList>
                  {(!jobOk || !profileOk) && (
                    <Banner
                      status="warning"
                      title={!jobOk ? "Add the job description first" : "Add your experience first"}
                      endContent={
                        <Button size="sm" label="Go there" onClick={() => setStep(!jobOk ? "job" : "you")} />
                      }
                    />
                  )}
                  {genErr && <Banner status="error" title="Couldn't generate" description={genErr} />}
                  <HStack justify="between" align="center" wrap="wrap" gap={3}>
                    <Button label="Back" variant="ghost" onClick={() => setStep("you")} />
                    <Button
                      label="Generate CV + cover letter"
                      variant="primary"
                      size="lg"
                      icon={<Icon icon={SparklesIcon} />}
                      isDisabled={!jobOk || !profileOk}
                      onClick={onGenerate}
                    />
                  </HStack>
                </VStack>
              </Card>
            )}
          </VStack>
        </LayoutContent>
      }
    />
  );
}
