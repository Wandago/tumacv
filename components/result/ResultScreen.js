"use client";
import { useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Grid, GridSpan } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { Link } from "@astryxdesign/core/Link";
import CvSheet, { printDocument } from "../home/CvSheet";
import ShareButtons from "../ShareButtons";
import Tile from "../brand/Tile";
import ApplyPanel from "./ApplyPanel";
import FitPanel from "./FitPanel";
import { TEMPLATES, resolveTemplate } from "../../lib/templates";
import { FREE_MODE } from "../../lib/plans";
import { generateCvDocx, downloadBlob } from "../../lib/generateDocx";
import { ArrowLeftIcon, DownloadIcon, PlusIcon, PrinterIcon } from "../../lib/icons";

// A freshly generated application, on the client side: right after the
// builder, and as the apply kit after "Tailor & apply" on the jobs page.
// (The dashboard opens saved ones in its own view, components/home/ResultView.js.)
export default function ResultScreen({ result, template, setTemplate, onBack, backLabel = "Edit inputs", onNew, newLabel = "New application" }) {
  const [tab, setTab] = useState("cv");
  const [copied, setCopied] = useState(false);
  const [docxBusy, setDocxBusy] = useState(false);
  const [err, setErr] = useState("");
  const design = resolveTemplate(template);

  const docName = (result.cv?.name || "").trim().replace(/\s+/g, "_");
  const printTitle = docName ? `${docName}_${tab === "cv" ? "CV" : "Cover_Letter"}` : undefined;
  const cvTitle = docName ? `${docName}_CV` : undefined;

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

  const doc = tab === "cv" ? <CvSheet.Cv data={result.cv} template={design} /> : <CvSheet.Letter text={result.coverLetter} />;

  return (
    <Layout
      height="auto"
      contentWidth={980}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <HStack justify="between" align="center" wrap="wrap" gap={2} className="no-print">
              <Button label={backLabel} variant="ghost" icon={<Icon icon={ArrowLeftIcon} />} onClick={onBack} />
              {onNew && <Button label={newLabel} icon={<Icon icon={PlusIcon} />} onClick={onNew} />}
            </HStack>

            <Grid columns={{ minWidth: 340 }} gap={4}>
              <GridSpan columns={result.fit ? 1 : "full"}>
                <ApplyPanel
                  result={result}
                  isFresh
                  onSavePdf={() => {
                    setTab("cv");
                    setTimeout(() => printDocument(cvTitle), 60);
                  }}
                />
              </GridSpan>
              <FitPanel fit={result.fit} />
            </Grid>

            <HStack justify="between" align="center" wrap="wrap" gap={3} className="no-print">
              <TabList value={tab} onChange={setTab}>
                <Tab value="cv" label="CV" />
                <Tab value="letter" label="Cover letter" />
              </TabList>
              {tab === "cv" ? (
                <HStack gap={2} align="center" wrap="wrap">
                  <Selector
                    label="Design"
                    isLabelHidden
                    size="sm"
                    width={150}
                    value={design}
                    onChange={setTemplate}
                    options={TEMPLATES.map((t) => ({ value: t.id, label: t.name }))}
                  />
                  <Button label="Word" size="sm" icon={<Icon icon={DownloadIcon} />} isLoading={docxBusy} onClick={downloadDocx} />
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

            <CvSheet>{doc}</CvSheet>
            <CvSheet.PrintCopy>{doc}</CvSheet.PrintCopy>

            <Tile tone="blush" padding={8} className="no-print">
              <VStack gap={4} hAlign="center">
                <Text color="secondary" justify="center">
                  Saved to your <Link href="/dashboard">dashboard</Link>
                  {!FREE_MODE && typeof result.creditsLeft === "number" ? ` · ${result.creditsLeft} applications left` : ""}
                </Text>
                {onNew && <Button label={newLabel === "New application" ? "Apply to another job" : newLabel} variant="primary" size="lg" icon={<Icon icon={PlusIcon} />} onClick={onNew} />}
                <Text type="supporting" color="secondary">Know someone else job hunting?</Text>
                <ShareButtons compact />
              </VStack>
            </Tile>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
