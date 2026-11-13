"use client";
import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import StepPills from "../vivid/StepPills";
import { StopwatchIllustration } from "../vivid/Illustration";

// The API doesn't stream progress, so these stages are paced to how long a
// generation typically takes (~20-40s). They describe what really happens,
// in order; the bar never claims to finish until the documents arrive.
const STAGES = [
  { at: 0, label: "Reading the job posting" },
  { at: 4, label: "Matching your experience to what it asks for" },
  { at: 11, label: "Rewriting your CV for this job" },
  { at: 20, label: "Writing your cover letter" },
  { at: 30, label: "Checking nothing was invented" },
];

export default function GenerationProgress() {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => setElapsed((Date.now() - started) / 1000), 250);
    return () => clearInterval(t);
  }, []);

  // Eases toward 95% so a slow run still looks alive without hitting 100.
  const percent = Math.round(95 * (1 - Math.exp(-elapsed / 16)));
  const current = STAGES.reduce((idx, s, i) => (elapsed >= s.at ? i : idx), 0);

  return (
    <Card variant="gray" padding={8}>
      <VStack gap={6}>
        <HStack justify="between" align="start" gap={4}>
          <VStack gap={2}>
            <StepPills total={STAGES.length} current={current} label={`Stage ${current + 1} of ${STAGES.length}`} />
            <Text color="secondary" weight="semibold">Tailoring your application</Text>
            <Heading level={2} type="display-1">
              <Text type="inherit" hasTabularNumbers>{percent}%</Text>
            </Heading>
            <Text color="secondary">
              Usually 20–40 seconds. Keep this tab open — if anything fails, no credit is used.
            </Text>
          </VStack>
          <StopwatchIllustration size={150} hideOnPhones />
        </HStack>
        <ProgressBar label="Progress" isLabelHidden value={percent} variant="accent" />
        <List density="compact">
          {STAGES.map((s, i) => (
            <ListItem
              key={s.label}
              label={s.label}
              startContent={
                i < current ? (
                  <Icon icon="success" />
                ) : i === current ? (
                  <Spinner size="sm" />
                ) : (
                  <Icon icon="clock" color="secondary" />
                )
              }
            />
          ))}
        </List>
        {elapsed > 45 && (
          <Text type="supporting" color="secondary">
            Taking longer than usual — long CVs need more time. Still working.
          </Text>
        )}
      </VStack>
    </Card>
  );
}
