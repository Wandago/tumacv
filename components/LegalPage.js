import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Divider } from "@astryxdesign/core/Divider";
import PageHeader from "./PageHeader";

// Shared layout for the privacy policy and terms: a capped reading column
// of headed sections.
export default function LegalPage({ title, intro, sections }) {
  return (
    <Layout
      height="auto"
      contentWidth={720}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <PageHeader title={title} description={intro} />
            <Divider />
            {sections.map((s) => (
              <VStack key={s.heading} gap={2}>
                <Heading level={2}>{s.heading}</Heading>
                <Text as="p" display="block" color="secondary" textWrap="pretty">{s.body}</Text>
              </VStack>
            ))}
          </VStack>
        </LayoutContent>
      }
    />
  );
}
