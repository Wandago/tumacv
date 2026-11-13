"use client";
import { useState } from "react";
import Tile from "../brand/Tile";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import StepPills from "../brand/StepPills";
import { PaperPlaneIllustration, CvIllustration } from "../brand/Illustration";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { APPLICATION_STATUSES } from "../../lib/applicationStatus";
import { PrinterIcon } from "../../lib/icons";

async function saveStatus(id, status) {
  const { data: sess } = await supabaseBrowser().auth.getSession();
  const res = await fetch("/api/applications/status", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Couldn't save that.");
  return (await res.json()).tracking;
}

// The headline card on a finished application. For a job picked from the
// jobs page it's the apply kit: save the CV, open the employer's apply page,
// and track where the application is at. Otherwise it's a plain "ready" card.
export default function ApplyPanel({ result, isFresh, onSavePdf }) {
  const job = result.job;
  const [status, setStatus] = useState(result.tracking?.status || (job ? "tailored" : ""));
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  async function changeStatus(next) {
    if (!result.id || next === status) return;
    const prev = status;
    setStatus(next);
    setSaving(true);
    setErr("");
    try {
      await saveStatus(result.id, next);
    } catch (e) {
      setStatus(prev);
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  function openApply() {
    window.open(job.applyUrl, "_blank", "noopener,noreferrer");
    if (status === "tailored") changeStatus("applied");
  }

  function savePdf() {
    onSavePdf();
    setSaved(true);
  }

  const title = job ? job.title : result.jobTitle || result.cv?.title || "Your application";
  const step = !job ? 0 : status && status !== "tailored" ? 2 : saved ? 1 : 0;

  return (
    <Tile tone="forest" padding={8} className="no-print">
      <VStack gap={4}>
        <HStack gap={3} align="start" justify="between">
          <VStack gap={3}>
            {job && <StepPills total={3} current={step} label={`Apply kit, step ${step + 1} of 3`} />}
            <VStack gap={1}>
              <Text color="secondary" weight="semibold">
                {job ? `Apply kit · ${job.company}` : isFresh ? "Your documents are ready" : "Saved application"}
              </Text>
              <Heading level={1} type="display-2" textWrap="balance">{title}</Heading>
              {job?.location && <Text color="secondary">{job.location} · via {job.source}</Text>}
            </VStack>
          </VStack>
          {job ? <PaperPlaneIllustration size={104} hideOnPhones /> : <CvIllustration size={104} hideOnPhones />}
        </HStack>

        {job && (
          <List density="compact">
            <ListItem label="CV and cover letter tailored to this job" startContent={<Icon icon="success" />} />
            <ListItem
              label="Save your CV as a PDF"
              description={<Text type="supporting" color="secondary">Most apply pages ask you to upload it.</Text>}
              startContent={<Icon icon={saved ? "success" : "clock"} />}
            />
            <ListItem
              label={job.applyUrl ? `Apply on ${job.source}` : "Apply as the employer asks"}
              description={
                <Text type="supporting" color="secondary">
                  {job.applyUrl ? "Opens the employer's page in a new tab — upload the PDF there." : job.howToApply}
                </Text>
              }
              startContent={<Icon icon={status && status !== "tailored" ? "success" : "clock"} />}
            />
          </List>
        )}

        <HStack gap={2} wrap="wrap" align="end">
          {job && <Button label="Save CV as PDF" variant={job.applyUrl ? "secondary" : "primary"} icon={<Icon icon={PrinterIcon} />} onClick={savePdf} />}
          {job?.applyUrl && (
            <Button label={`Apply on ${job.source}`} variant="primary" endContent={<Icon icon="externalLink" />} onClick={openApply} />
          )}
          {result.id && (
            <Selector
              label="Status"
              size="md"
              width={170}
              value={status || "tailored"}
              onChange={changeStatus}
              isDisabled={saving}
              options={APPLICATION_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          )}
        </HStack>
        {err && <Text color="secondary">{err}</Text>}
      </VStack>
    </Tile>
  );
}
