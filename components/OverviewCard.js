import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Grid } from "@astryxdesign/core/Grid";
import DonutChart, { segmentColor } from "./DonutChart";

// Donut + legend breakdown card. `segments` are [{ label, value }]; `stats`
// are optional [{ label, value }] figures shown underneath.
export default function OverviewCard({ title, segments, centerValue, centerLabel, stats, empty }) {
  const total = segments.reduce((a, s) => a + s.value, 0);

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <Heading level={3}>{title}</Heading>
        {total === 0 ? (
          <Text color="secondary">{empty || "No data yet."}</Text>
        ) : (
          <HStack gap={5} align="center" wrap="wrap">
            <DonutChart segments={segments} value={centerValue} label={centerLabel} size={124} stroke={16} />
            <StackItem size="fill">
              <VStack gap={2}>
                {segments.map((s, i) => (
                  <HStack key={s.label} gap={2} align="center" justify="between">
                    <HStack gap={2} align="center">
                      {/* The dot's colour must match its arc, so it's set directly. */}
                      <svg width="10" height="10" aria-hidden="true"><circle cx="5" cy="5" r="5" style={{ fill: segmentColor(i) }} /></svg>
                      <Text>{s.label.charAt(0).toUpperCase() + s.label.slice(1)}</Text>
                    </HStack>
                    <Text color="secondary" hasTabularNumbers>
                      {s.value} · {Math.round((s.value / total) * 100)}%
                    </Text>
                  </HStack>
                ))}
              </VStack>
            </StackItem>
          </HStack>
        )}
        {stats?.length > 0 && (
          <Grid columns={{ minWidth: 90 }} gap={3}>
            {stats.map((s) => (
              <VStack key={s.label} gap={0}>
                <Text size="lg" weight="bold" hasTabularNumbers>{s.value}</Text>
                <Text type="supporting" color="secondary">{s.label}</Text>
              </VStack>
            ))}
          </Grid>
        )}
      </VStack>
    </Card>
  );
}
