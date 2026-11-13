"use client";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Token } from "@astryxdesign/core/Token";
import { matchScore } from "../../lib/gamification";

// How well the CV covers the job: matched keywords in green, gaps in red.
// Gaps are never papered over by the AI, so this is where they surface.
export default function FitCheck({ fit }) {
  if (!fit) return null;
  const score = matchScore(fit);
  const matched = fit.matched || [];
  const missing = fit.missing || [];
  if (!matched.length && !missing.length) return null;
  const variant = score >= 70 ? "success" : score >= 40 ? "warning" : "error";

  return (
    <Card padding={5} className="no-print">
      <VStack gap={4}>
        <HStack justify="between" align="center" gap={4} wrap="wrap">
          <VStack gap={0}>
            <Heading level={3}>Fit check</Heading>
            <Text type="supporting" color="secondary">How much of what this job asks for your CV covers</Text>
          </VStack>
          {score !== null && (
            <Text size="xl" weight="bold" hasTabularNumbers>
              {score}% match
            </Text>
          )}
        </HStack>
        {score !== null && <ProgressBar label="Match" isLabelHidden value={score} variant={variant} />}
        <HStack gap={2} wrap="wrap">
          {matched.map((k) => (
            <Token key={`m-${k}`} label={k} color="green" size="sm" />
          ))}
          {missing.map((k) => (
            <Token key={`x-${k}`} label={k} color="red" size="sm" />
          ))}
        </HStack>
        {missing.length > 0 && (
          <Text type="supporting" color="secondary">
            Red items are asked for in the job but aren't in your profile. If you do have them, add them and
            generate again. If you don't, prepare an answer for the interview — nothing was invented to cover the gap.
          </Text>
        )}
      </VStack>
    </Card>
  );
}
