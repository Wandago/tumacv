import { VStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";

// Articles are stored as plain paragraphs separated by blank lines, with the
// odd one-line section label (see app/api/cron/generate-articles). A short
// line with no closing punctuation is treated as such a label.
const isLabel = (p) => p.length < 70 && !/[.!?:"”)]$/.test(p) && !p.includes("\n");

export default function ArticleBody({ content }) {
  const paragraphs = (content || "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <VStack gap={4}>
      {paragraphs.map((p, i) =>
        isLabel(p) ? (
          <Heading key={i} level={3}>{p}</Heading>
        ) : (
          <Text key={i} as="p" display="block" textWrap="pretty">{p}</Text>
        )
      )}
    </VStack>
  );
}
