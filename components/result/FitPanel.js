"use client";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Token } from "@astryxdesign/core/Token";
import Tile from "../brand/Tile";
import { TargetIllustration } from "../brand/Illustration";
import { matchScore } from "../../lib/gamification";

// How well the CV covers the job: the match score as a big number, what
// matched, and the gaps — which the AI never papers over, so they surface here.
export default function FitPanel({ fit }) {
  if (!fit) return null;
  const score = matchScore(fit);
  const matched = fit.matched || [];
  const missing = fit.missing || [];
  if (!matched.length && !missing.length) return null;

  return (
    <Tile tone="sunshine" padding={8} className="no-print">
      <VStack gap={4}>
        <HStack justify="between" align="start" gap={3}>
          <VStack gap={0}>
            <Text weight="semibold" color="secondary">Fit check</Text>
            {score !== null && (
              <Heading level={2} type="display-1">
                <Text type="inherit" hasTabularNumbers>{score}%</Text>
              </Heading>
            )}
            <Text color="secondary">of what this job asks for is in your CV</Text>
          </VStack>
          <TargetIllustration size={104} float />
        </HStack>
        {score !== null && <ProgressBar label="Match" isLabelHidden value={score} variant="accent" />}
        <HStack gap={2} wrap="wrap">
          {matched.map((k) => (
            <Token key={`m-${k}`} label={k} color="green" size="sm" />
          ))}
          {missing.map((k) => (
            <Token key={`x-${k}`} label={`Missing: ${k}`} color="red" size="sm" />
          ))}
        </HStack>
        {missing.length > 0 && (
          <Text type="supporting" color="secondary">
            “Missing” items are asked for but aren't in your profile. Have them? Add them and generate again. If not,
            prepare an answer for the interview — nothing was invented to cover the gap.
          </Text>
        )}
      </VStack>
    </Tile>
  );
}
