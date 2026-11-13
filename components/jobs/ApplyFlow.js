"use client";
import { useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Icon } from "@astryxdesign/core/Icon";
import { MetadataList, MetadataListItem } from "@astryxdesign/core/MetadataList";
import GenerationProgress from "../home/GenerationProgress";
import ResultScreen from "../result/ResultScreen";
import CreditsModal from "../CreditsModal";
import { TEMPLATES, DEFAULT_TEMPLATE } from "../../lib/templates";
import { FREE_MODE, isUnlimited } from "../../lib/plans";
import { SparklesIcon } from "../../lib/icons";

const words = (s) => (s.trim() ? s.trim().split(/\s+/).length : 0);

// Full-page screens of the one-tap apply flow: the progress while tailoring,
// then the finished application with its apply kit. Null in other phases.
export function ApplyScreen({ flow, onBack }) {
  const { state } = flow;
  const [template, setTemplate] = useState(state.template || DEFAULT_TEMPLATE);
  if (state.phase === "generating") {
    return <Layout height="auto" contentWidth={720} content={<LayoutContent padding={6} isScrollable={false}><GenerationProgress /></LayoutContent>} />;
  }
  if (state.phase === "done") {
    return (
      <ResultScreen
        result={state.result}
        template={template}
        setTemplate={setTemplate}
        backLabel="Back to jobs"
        onBack={onBack}
        onNew={onBack}
        newLabel="Apply to another job"
      />
    );
  }
  return null;
}

// The dialogs around it: confirm, add-your-CV-first, errors, top-up.
export function ApplyDialogs({ flow, user }) {
  const { state, confirm, reset, toBuilder } = flow;
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const close = (open) => !open && reset();

  if (state.phase === "needCredits") return <CreditsModal user={user} onClose={reset} />;

  const unlimited = FREE_MODE || isUnlimited(state.profile);

  return (
    <>
      <Dialog isOpen={state.phase === "loading"} onOpenChange={close} width={360}>
        <Center minHeight={140}><Spinner size="lg" /></Center>
      </Dialog>

      <Dialog isOpen={state.phase === "confirm"} onOpenChange={close} width={520}>
        <DialogHeader title="Tailor your CV for this job?" subtitle={state.job ? `${state.job.title} · ${state.job.company}` : undefined} onOpenChange={close} />
        <VStack gap={4} padding={5}>
          <Text color="secondary">
            TumaCV rewrites your CV and a cover letter for this job from your real experience, saves it to your tracker, and
            gives you the link to apply.
          </Text>
          {state.phase === "confirm" && (
            <MetadataList label={{ position: "start", width: 110 }}>
              <MetadataListItem label="Your CV">
                <Text>Saved CV · {words(state.profileText).toLocaleString()} words</Text>
              </MetadataListItem>
              <MetadataListItem label="Cost">
                <Text>
                  {unlimited
                    ? FREE_MODE ? "Free during beta" : "Included in your plan"
                    : `1 application · you have ${state.profile?.credits ?? 0}`}
                </Text>
              </MetadataListItem>
            </MetadataList>
          )}
          <Selector
            label="CV style"
            value={template}
            onChange={setTemplate}
            options={TEMPLATES.map((t) => ({ value: t.id, label: `${t.name} — ${t.desc}` }))}
          />
          <HStack justify="between" gap={2} wrap="wrap">
            <Button label="Edit my CV first" variant="ghost" onClick={() => toBuilder(state.job)} />
            <Button label="Tailor & apply" variant="primary" icon={<Icon icon={SparklesIcon} />} onClick={() => confirm(template)} />
          </HStack>
        </VStack>
      </Dialog>

      <Dialog isOpen={state.phase === "needCv"} onOpenChange={close} width={480}>
        <DialogHeader title="Add your CV once" onOpenChange={close} />
        <VStack gap={4} padding={5}>
          <Text color="secondary">
            TumaCV tailors from your real experience, so it needs your CV first — upload your LinkedIn PDF, a photo of
            your CV, or paste it. After that, every job is one tap.
          </Text>
          <HStack justify="end">
            <Button label="Add my CV" variant="primary" onClick={() => toBuilder(state.job)} />
          </HStack>
        </VStack>
      </Dialog>

      <Dialog isOpen={state.phase === "error"} onOpenChange={close} width={480}>
        <DialogHeader title="Couldn't tailor that one" onOpenChange={close} />
        <VStack gap={4} padding={5}>
          <Banner status="error" title={state.message || "Something went wrong."} />
          <HStack justify="end" gap={2}>
            {state.job?.applyUrl && <Button label={`Open on ${state.job.source}`} variant="ghost" href={state.job.applyUrl} target="_blank" />}
            <Button label="Close" variant="primary" onClick={reset} />
          </HStack>
        </VStack>
      </Dialog>
    </>
  );
}
