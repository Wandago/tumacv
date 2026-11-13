import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";

// The title block at the top of content pages: optional eyebrow, the page
// heading, a supporting line, and optional actions.
export default function PageHeader({ eyebrow, title, description, actions, isCentered = false }) {
  const align = isCentered ? "center" : "start";
  return (
    <VStack gap={2} hAlign={isCentered ? "center" : "stretch"}>
      {eyebrow && <Text color="accent" weight="semibold" justify={align}>{eyebrow}</Text>}
      <Heading level={1} type={isCentered ? "display-2" : undefined} justify={align} textWrap="balance">{title}</Heading>
      {description && <Text type="large" color="secondary" weight="normal" justify={align} textWrap="pretty">{description}</Text>}
      {actions && <HStack gap={2} wrap="wrap" justify={align}>{actions}</HStack>}
    </VStack>
  );
}
