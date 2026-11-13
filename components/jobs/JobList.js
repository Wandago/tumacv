"use client";
import { List, ListItem } from "@astryxdesign/core/List";
import { HStack } from "@astryxdesign/core/Stack";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Token } from "@astryxdesign/core/Token";
import { Button } from "@astryxdesign/core/Button";
import { Icon } from "@astryxdesign/core/Icon";
import { SparklesIcon } from "../../lib/icons";
import { postedAgo } from "./jobText";

// Jobs as rows: logo, title, company · where · when, the source it came
// from, and the one-tap apply button. Tapping the row opens the full listing.
export default function JobList({ jobs, onOpen, onApply, compact = false }) {
  return (
    <List hasDividers>
      {jobs.map((j) => (
        <ListItem
          key={j.id}
          label={j.title}
          description={[j.company, j.location, !compact && j.type, postedAgo(j.postedAt)].filter(Boolean).join(" · ")}
          startContent={<Avatar src={j.logo || undefined} name={j.company} size="md" tooltip={false} />}
          endContent={
            <HStack gap={2} align="center">
              {!compact && <Token size="sm" label={j.source} color={j.source === "TumaCV" ? "green" : "gray"} className="hide-on-phones" />}
              <Button
                label="Tailor & apply"
                size="sm"
                variant="primary"
                icon={<Icon icon={SparklesIcon} />}
                className="hide-on-phones"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(j);
                }}
              />
              <Button
                label="Apply"
                tooltip={`Tailor your CV and apply: ${j.title}`}
                size="sm"
                variant="primary"
                className="show-on-phones"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(j);
                }}
              />
            </HStack>
          }
          onClick={() => onOpen(j)}
        />
      ))}
    </List>
  );
}
