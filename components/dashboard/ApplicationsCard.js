"use client";
import { useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { List, ListItem } from "@astryxdesign/core/List";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Button } from "@astryxdesign/core/Button";
import { Avatar } from "@astryxdesign/core/Avatar";
import { Token } from "@astryxdesign/core/Token";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Icon } from "@astryxdesign/core/Icon";
import { matchScore } from "../../lib/gamification";
import { statusOf } from "../../lib/applicationStatus";
import { FileTextIcon, PlusIcon } from "../../lib/icons";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

// The user's generation history as rows: job, style, date, and match score.
export default function ApplicationsCard({ history, onOpen, onNew }) {
  const [q, setQ] = useState("");
  const filtered = history.filter((h) => !q || (h.job_title || "Application").toLowerCase().includes(q.toLowerCase()));

  return (
    <Card padding={0}>
      <VStack gap={0}>
        <VStack gap={3} padding={5}>
          <HStack justify="between" align="center" gap={3} wrap="wrap">
            <VStack gap={0}>
              <Heading level={3}>Your applications</Heading>
              <Text type="supporting" color="secondary">Open one to download it again, switch its style, or update where it's at.</Text>
            </VStack>
            <Button label="New application" variant="primary" size="sm" icon={<Icon icon={PlusIcon} />} onClick={onNew} />
          </HStack>
          {history.length > 3 && (
            <TextInput label="Search applications" isLabelHidden placeholder="Search by job title…" value={q} onChange={setQ} startIcon="search" hasClear />
          )}
        </VStack>
        {history.length === 0 ? (
          <EmptyState
            icon={<Icon icon={FileTextIcon} size="lg" />}
            title="No applications yet"
            description="Paste a job and your CV — your first tailored application takes about a minute."
            actions={<Button label="Generate your first CV" variant="primary" onClick={onNew} />}
          />
        ) : filtered.length === 0 ? (
          <VStack padding={5}>
            <Text color="secondary">No applications match “{q}”.</Text>
          </VStack>
        ) : (
          <List hasDividers>
            {filtered.map((h) => {
              const score = matchScore(h.result?.fit);
              const status = statusOf(h);
              const job = h.result?.job;
              return (
                <ListItem
                  key={h.id}
                  label={h.job_title || "Application"}
                  description={[job?.source && `via ${job.source}`, (h.template || "modern").replace(/^./, (c) => c.toUpperCase()), fmtDate(h.created_at)].filter(Boolean).join(" · ")}
                  startContent={<Avatar name={job?.company || h.job_title || "A"} size="sm" tooltip={false} />}
                  endContent={
                    <HStack gap={2} align="center">
                      {status && <Token size="sm" label={status.label} color={status.color} />}
                      {score !== null && (
                        <Token size="sm" label={`${score}% match`} color={score >= 70 ? "green" : score >= 40 ? "yellow" : "red"} />
                      )}
                    </HStack>
                  }
                  onClick={() => onOpen(h)}
                />
              );
            })}
          </List>
        )}
      </VStack>
    </Card>
  );
}
