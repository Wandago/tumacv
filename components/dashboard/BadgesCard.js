import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Grid } from "@astryxdesign/core/Grid";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { BADGES, earnedBadges, isEarned, badgeRemaining } from "../../lib/gamification";

export default function BadgesCard({ stats, upcoming }) {
  const earned = earnedBadges(stats).length;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack justify="between" align="center" wrap="wrap" gap={2}>
          <VStack gap={0}>
            <Heading level={3}>Your badges</Heading>
            <Text type="supporting" color="secondary">
              {upcoming ? `${badgeRemaining(upcoming, stats)} to unlock “${upcoming.label}” ${upcoming.emoji}` : "Every badge earned — impressive."}
            </Text>
          </VStack>
          <Text weight="bold" hasTabularNumbers>{earned}/{BADGES.length}</Text>
        </HStack>
        <ProgressBar label="Badges earned" isLabelHidden value={earned} max={BADGES.length} />
        <Grid columns={{ minWidth: 150 }} gap={2}>
          {BADGES.map((b) => {
            const on = isEarned(b, stats);
            return (
              <Card key={b.id} padding={3} variant={on ? "green" : "muted"}>
                <VStack gap={0.5}>
                  <Text size="xl" aria-hidden="true">{on ? b.emoji : "🔒"}</Text>
                  <Text weight="semibold" color={on ? "primary" : "secondary"}>{b.label}</Text>
                  <Text type="supporting" color="secondary">{b.hint}</Text>
                </VStack>
              </Card>
            );
          })}
        </Grid>
      </VStack>
    </Card>
  );
}
