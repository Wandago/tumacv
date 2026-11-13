"use client";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Token } from "@astryxdesign/core/Token";
import { matchScore } from "../../lib/gamification";
import { TargetIllustration } from "../vivid/Illustration";

// How well the CV covers the job: the match score as a big number, matched
// keywords in green, gaps in red.
// Gaps are never papered over by the AI, so this is where they surface.
export default function FitCheck({ fit }) {
  if (!fit) return null;
  const score = matchScore(fit);
  const matched = fit.matched || [];
  const missing = fit.missing || [];
  if (!matched.length && !missing.length) return null;
  const variant = score >= 70 ? "success" : score >= 40 ? "warning" : "error";

  return (
    <Card variant="yellow" padding={6} className="no-print">
      <VStack gap={4}>
        <HStack justify="between" align="start" gap={3}>
          <VStack gap={0}>
            <Text weight="semibold" color="secondary">Fit check</Text>
            {score !== null ? (
              <Heading level={2} type="display-1">
                <Text type="inherit" hasTabularNumbers>{score}%</Text>
              </Heading>
            ) : (
              <Heading level={2} type="display-3">Your match</Heading>
            )}
            <Text color="secondary">of what this job asks for is in your CV</Text>
          </VStack>
          <TargetIllustration size={96} />
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
            Red items are asked for but aren't in your profile. Have them? Add them and generate again. If not, prepare
            an answer for the interview — nothing was invented to cover the gap.
          </Text>
        )}
      </VStack>
    </Card>
  );
}
