import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import Tile from "./brand/Tile";

// The title block at the top of content pages: optional eyebrow, the page
// heading, a supporting line, and optional actions. With a `tone` it sits on
// a Kijani Pop colour tile with an illustration beside it (hub, news,
// support); without one it stays quiet on the page (legal pages).
export default function PageHeader({ eyebrow, title, description, actions, isCentered = false, tone, illustration }) {
  const align = isCentered ? "center" : "start";
  const block = (
    <VStack gap={3} hAlign={isCentered ? "center" : "stretch"}>
      {eyebrow && <Text color={tone ? "secondary" : "accent"} weight="semibold" justify={align}>{eyebrow}</Text>}
      <Heading level={1} type={tone ? "display-1" : "display-2"} justify={align} textWrap="balance">{title}</Heading>
      {description && <Text type="large" color="secondary" weight="normal" justify={align} textWrap="pretty">{description}</Text>}
      {actions && <HStack gap={2} wrap="wrap" justify={align}>{actions}</HStack>}
    </VStack>
  );
  if (!tone) return block;
  return (
    <Tile tone={tone} padding={10}>
      <HStack gap={6} align="center">
        <StackItem size="fill">{block}</StackItem>
        {illustration}
      </HStack>
    </Tile>
  );
}
