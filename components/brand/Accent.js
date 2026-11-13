import { Text } from "@astryxdesign/core/Text";

// The editorial accent: a word or two of a headline set in Instrument Serif
// italic, in the brand colour — "One job. One *tailored* CV."
export default function Accent({ children }) {
  return (
    <Text as="em" type="inherit" className="accent-serif">
      {children}
    </Text>
  );
}
