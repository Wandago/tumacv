"use client";
import { useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
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
import CvSheet from "./CvSheet";
import Tile from "../brand/Tile";
import Accent from "../brand/Accent";
import StepPills from "../brand/StepPills";
import { CvIllustration, JobSearchIllustration, SwatchIllustration } from "../brand/Illustration";
import { TEMPLATES, resolveTemplate } from "../../lib/templates";
import { SAMPLE_CV } from "../../lib/sampleCv";
import { looksLikeBareLinkedInUrl } from "../../lib/linkedin";
import { ArrowLeftIcon, ArrowRightIcon, BriefcaseIcon, SparklesIcon } from "../../lib/icons";

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

const STEPS = {
  job: {
    index: 0,
    tone: "magenta",
    Illustration: JobSearchIllustration,
    title: (
      <>
        Which job is it <Accent>for?</Accent>
      </>
    ),
    sub: "Paste a link from BrighterMonday, Fuzu, MyJobMag or a careers page — or paste the description itself.",
  },
  you: {
    index: 1,
    tone: "tangerine",
    Illustration: CvIllustration,
    title: (
      <>
        Tell us about <Accent>you</Accent>
      </>
    ),
    sub: "Upload your LinkedIn PDF or a photo of your CV — or paste it. Saved to your account, so you only do this once.",
  },
  style: {
    index: 2,
    tone: "plum",
    Illustration: SwatchIllustration,
    title: (
      <>
        Pick your <Accent>look</Accent>
      </>
    ),
    sub: "Eight designs, all print-ready. Switch any time after it's generated — the words stay the same.",
  },
};

const ORDER = ["job", "you", "style"];
const LABELS = { job: "The job", you: "Your CV", style: "Design" };

export default function Builder({
  jobUrl, setJobUrl, jobText, setJobText, fetchJd, fetching, fetchErr,
  profileText, setProfileText, profileWasSaved, onPdf, pdfBusy, pdfErr, onPhotos, photoBusy, photoErr,
  template, setTemplate, onGenerate, loading, genErr,
}) {
  const [step, setStep] = useState(filled(jobText) && filled(profileText) ? "style" : filled(jobText) ? "you" : "job");
  const jobOk = filled(jobText);
  const profileOk = filled(profileText);
  const done = { job: jobOk, you: profileOk, style: false };
  const s = STEPS[step];
  const design = resolveTemplate(template);

  if (loading) {
    return (
      <Layout height="auto" contentWidth={760} content={<LayoutContent padding={6} isScrollable={false}><GenerationProgress /></LayoutContent>} />
    );
  }

  return (
    <Layout
      height="auto"
      contentWidth={960}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={5}>
            <Tile tone={s.tone} padding={8}>
              <HStack gap={6} align="center">
                <StackItem size="fill">
                  <VStack gap={4}>
                    <StepPills total={3} current={s.index} />
                    <VStack gap={2}>
                      <Text color="secondary" weight="semibold">Step {s.index + 1} of 3 · Tailor your CV</Text>
                      <Heading level={1} type="display-1" textWrap="balance">{s.title}</Heading>
                      <Text type="large" color="secondary" textWrap="pretty">{s.sub}</Text>
                    </VStack>
                    <HStack gap={2} wrap="wrap">
                      {ORDER.map((k, i) => (
                        <Button
                          key={k}
                          size="sm"
                          variant={step === k ? "primary" : "ghost"}
                          label={`${done[k] ? "✓" : i + 1}  ${LABELS[k]}`}
                          onClick={() => setStep(k)}
                        />
                      ))}
                    </HStack>
                  </VStack>
                </StackItem>
                <s.Illustration size={190} hideOnPhones float />
              </HStack>
            </Tile>

            {step === "job" && (
              <Card padding={8}>
                <VStack gap={5}>
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
                  <HStack justify="between" align="center" gap={3} wrap="wrap">
                    <Button label="Browse live jobs" variant="ghost" icon={<Icon icon={BriefcaseIcon} />} href="/jobs" />
                    <Button
                      label="Continue"
                      variant="primary"
                      size="lg"
                      endContent={<Icon icon={ArrowRightIcon} />}
                      isDisabled={!jobOk}
                      onClick={() => setStep("you")}
                    />
                  </HStack>
                </VStack>
              </Card>
            )}

            {step === "you" && (
              <Card padding={8}>
                <VStack gap={5}>
                  {profileWasSaved && profileOk && (
                    <Banner status="success" title="We kept your CV from last time" description="Check it's still up to date, then continue." />
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
                    <Button label="Back" variant="ghost" icon={<Icon icon={ArrowLeftIcon} />} onClick={() => setStep("job")} />
                    <Button
                      label="Continue"
                      variant="primary"
                      size="lg"
                      endContent={<Icon icon={ArrowRightIcon} />}
                      isDisabled={!profileOk}
                      onClick={() => setStep("style")}
                    />
                  </HStack>
                </VStack>
              </Card>
            )}

            {step === "style" && (
              <Card padding={8}>
                <VStack gap={6}>
                  <Grid columns={{ minWidth: 200 }} gap={4}>
                    {TEMPLATES.map((t) => (
                      <SelectableCard key={t.id} label={t.name} isSelected={design === t.id} onChange={() => setTemplate(t.id)} padding={3}>
                        <VStack gap={3}>
                          <VStack className="cv-thumb" aria-hidden="true">
                            <CvSheet>
                              <CvSheet.Cv data={SAMPLE_CV} template={t.id} />
                            </CvSheet>
                          </VStack>
                          <VStack gap={0}>
                            <Text weight="semibold">{t.name}</Text>
                            <Text type="supporting" color="secondary">{t.desc}</Text>
                          </VStack>
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
                      endContent={<Button size="sm" label="Go there" onClick={() => setStep(!jobOk ? "job" : "you")} />}
                    />
                  )}
                  {genErr && <Banner status="error" title="Couldn't generate" description={genErr} />}
                  <HStack justify="between" align="center" wrap="wrap" gap={3}>
                    <Button label="Back" variant="ghost" icon={<Icon icon={ArrowLeftIcon} />} onClick={() => setStep("you")} />
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
