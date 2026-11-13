import { HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";

// A slow, endless strip of words. The items are rendered twice so the loop is
// seamless; the second copy is hidden from screen readers. Static for people
// who prefer reduced motion (app/app.css).
export default function Marquee({ items, label }) {
  const row = (hidden) =>
    items.map((it, i) => (
      <Text key={`${hidden ? "b" : "a"}-${i}`} size="xl" weight="semibold" color="secondary" aria-hidden={hidden || undefined}>
        {it}
        <Text as="span" type="inherit" color="accent" aria-hidden="true">{"  ✦  "}</Text>
      </Text>
    ));
  return (
    <HStack className="marquee" aria-label={label} role="group">
      <HStack gap={0} className="marquee-track" wrap="nowrap">
        {row(false)}
        {row(true)}
      </HStack>
    </HStack>
  );
}
