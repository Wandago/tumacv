"use client";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { List, ListItem } from "@astryxdesign/core/List";
import { Text } from "@astryxdesign/core/Text";

const STEPS = [
  "On a computer (not the mobile app), open your LinkedIn profile.",
  "Click the More button, just below your profile photo.",
  "Choose Save to PDF from the dropdown.",
  "Upload the downloaded PDF here.",
];

export default function LinkedInGuide() {
  return (
    <Collapsible defaultIsOpen={false} trigger={<Text weight="semibold">How to save your LinkedIn profile as a PDF</Text>}>
      <List listStyle="decimal" density="compact">
        {STEPS.map((s) => (
          <ListItem key={s} label={s} />
        ))}
      </List>
    </Collapsible>
  );
}
