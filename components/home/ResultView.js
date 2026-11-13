"use client";
import { useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { Link } from "@astryxdesign/core/Link";
import CvSheet, { printDocument } from "./CvSheet";
import FitCheck from "./FitCheck";
import ShareButtons from "../ShareButtons";
import { TEMPLATES, resolveTemplate } from "../../lib/templates";
import { FREE_MODE } from "../../lib/plans";
import { generateCvDocx, downloadBlob } from "../../lib/generateDocx";
import { ArrowLeftIcon, DownloadIcon, PlusIcon, PrinterIcon } from "../../lib/icons";

// The dashboard's view of a saved application, in the dashboard's original
// look (it stays as it was). Client-facing screens use
// components/result/ResultScreen.js instead.
export default function ResultView({ result, template, setTemplate, onBack, backLabel = "Edit inputs", onNew, isFresh = true }) {
  const [tab, setTab] = useState("cv");
  const [copied, setCopied] = useState(false);
  const [docxBusy, setDocxBusy] = useState(false);
  const [err, setErr] = useState("");

  const docName = (result.cv?.name || "").trim().replace(/\s+/g, "_");
  const printTitle = docName ? `${docName}_${tab === "cv" ? "CV" : "Cover_Letter"}` : undefined;

  async function copyLetter() {
    await navigator.clipboard.writeText(result.coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function downloadDocx() {
    setDocxBusy(true);
    setErr("");
    try {
      const blob = await generateCvDocx(result.cv);
      const safeName = (result.cv?.name || "CV").replace(/[^a-z0-9]+/gi, "_");
      downloadBlob(blob, `${safeName}_CV.docx`);
    } catch (e) {
      console.error(e);
      setErr("Could not create the Word file. Try again, or use Save as PDF instead.");
    } finally {
      setDocxBusy(false);
    }
  }

  return (
    <Layout
      height="auto"
      contentWidth={900}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={5}>
            <HStack justify="between" align="center" wrap="wrap" gap={3} className="no-print">
              <VStack gap={1}>
                <Text color="accent" weight="semibold">{isFresh ? "Your documents are ready" : "Saved application"}</Text>
                <Heading level={1}>{result.jobTitle || result.cv?.title || "Your application"}</Heading>
              </VStack>
              <HStack gap={2} wrap="wrap">
                <Button label={backLabel} variant="ghost" icon={<Icon icon={ArrowLeftIcon} />} onClick={onBack} />
                {onNew && <Button label="New application" icon={<Icon icon={PlusIcon} />} onClick={onNew} />}
              </HStack>
            </HStack>

            <FitCheck fit={result.fit} />

            <HStack justify="between" align="center" wrap="wrap" gap={3} className="no-print">
              <TabList value={tab} onChange={setTab}>
                <Tab value="cv" label="CV" />
                <Tab value="letter" label="Cover letter" />
              </TabList>
              {tab === "cv" ? (
                <HStack gap={2} align="center" wrap="wrap">
                  <Selector
                    label="Style"
                    isLabelHidden
                    size="sm"
                    width={140}
                    value={resolveTemplate(template)}
                    onChange={setTemplate}
                    options={TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                  />
                  <Button label="Word (.docx)" size="sm" icon={<Icon icon={DownloadIcon} />} isLoading={docxBusy} onClick={downloadDocx} />
                  <Button label="Save as PDF" size="sm" variant="primary" icon={<Icon icon={PrinterIcon} />} onClick={() => printDocument(printTitle)} />
                </HStack>
              ) : (
                <HStack gap={2} wrap="wrap">
                  <Button label={copied ? "Copied" : "Copy letter"} size="sm" icon={<Icon icon={copied ? "check" : "copy"} />} onClick={copyLetter} />
                  <Button label="Save as PDF" size="sm" variant="primary" icon={<Icon icon={PrinterIcon} />} onClick={() => printDocument(printTitle)} />
                </HStack>
              )}
            </HStack>
            {err && <Banner status="error" title={err} />}

            <CvSheet>
              {tab === "cv" ? <CvSheet.Cv data={result.cv} template={template} /> : <CvSheet.Letter text={result.coverLetter} />}
            </CvSheet>
            <CvSheet.PrintCopy>
              {tab === "cv" ? <CvSheet.Cv data={result.cv} template={template} /> : <CvSheet.Letter text={result.coverLetter} />}
            </CvSheet.PrintCopy>

            {isFresh && (
            <Card variant="muted" padding={5} className="no-print">
              <VStack gap={4} hAlign="center">
                <Text color="secondary" justify="center">
                  Saved to your <Link href="/dashboard">dashboard</Link>
                  {!FREE_MODE && typeof result.creditsLeft === "number" ? ` · ${result.creditsLeft} applications left` : ""}
                </Text>
                <Button label="Apply to another job" variant="primary" icon={<Icon icon={PlusIcon} />} onClick={onNew} />
                <Text type="supporting" color="secondary">Know someone else job hunting?</Text>
                <ShareButtons compact />
              </VStack>
            </Card>
            )}
          </VStack>
        </LayoutContent>
      }
    />
  );
}
