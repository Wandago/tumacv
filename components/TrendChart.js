import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Skeleton } from "@astryxdesign/core/Skeleton";

// Small area+line sparkline card. `series` is [{ date, value }].
export default function TrendChart({ title, series, format = (n) => n, loading }) {
  if (!series || loading) {
    return (
      <Card padding={5}>
        <VStack gap={3}>
          <Heading level={3}>{title}</Heading>
          <Skeleton height={64} />
        </VStack>
      </Card>
    );
  }
  const values = series.map((d) => d.value);
  const max = Math.max(1, ...values);
  const w = 100, h = 34;
  const points = series
    .map((d, i) => `${(i / Math.max(1, series.length - 1)) * w},${h - (d.value / max) * h}`)
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const total = values.reduce((a, b) => a + b, 0);
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" });

  return (
    <Card padding={5}>
      <VStack gap={3}>
        <HStack justify="between" align="center">
          <Heading level={3}>{title}</Heading>
          <Text size="xl" weight="bold" hasTabularNumbers>{format(total)}</Text>
        </HStack>
        <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height="72" aria-hidden="true">
          <polygon points={areaPoints} style={{ fill: "var(--color-accent-muted)" }} />
          <polyline
            points={points}
            fill="none"
            vectorEffect="non-scaling-stroke"
            style={{ stroke: "var(--color-accent)", strokeWidth: 2 }}
          />
        </svg>
        <HStack justify="between">
          <Text type="supporting" color="secondary">{series[0] ? fmtDate(series[0].date) : ""}</Text>
          <Text type="supporting" color="secondary">{series[series.length - 1] ? fmtDate(series[series.length - 1].date) : ""}</Text>
        </HStack>
      </VStack>
    </Card>
  );
}
