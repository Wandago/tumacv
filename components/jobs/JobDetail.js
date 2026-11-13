"use client";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Token } from "@astryxdesign/core/Token";
import { Icon } from "@astryxdesign/core/Icon";
import ArticleBody from "../ArticleBody";
import { SparklesIcon } from "../../lib/icons";
import { postedAgo } from "./jobText";

// The full listing, with the one-tap apply and a link to the original.
export default function JobDetail({ job, onClose, onApply }) {
  const close = (open) => !open && onClose();
  return (
    <Dialog isOpen={!!job} onOpenChange={close} width={760} maxHeight="88vh">
      {job && (
        <>
          <DialogHeader title={job.title} subtitle={`${job.company} · via ${job.source}`} onOpenChange={close} />
          <VStack gap={5} padding={5}>
            <HStack gap={2} wrap="wrap">
              {job.location && <Token label={job.location} size="sm" />}
              {job.type && <Token label={job.type} size="sm" />}
              {job.salary && <Token label={job.salary} size="sm" color="yellow" />}
              {job.postedAt && <Token label={`Posted ${postedAgo(job.postedAt)}`} size="sm" />}
            </HStack>
            <HStack gap={2} wrap="wrap">
              <Button label="Tailor my CV & apply" variant="primary" icon={<Icon icon={SparklesIcon} />} onClick={() => onApply(job)} />
              {job.applyUrl && (
                <Button label={`View on ${job.source}`} variant="ghost" endContent={<Icon icon="externalLink" />} href={job.applyUrl} target="_blank" />
              )}
            </HStack>
            <ArticleBody content={job.description} />
            {job.howToApply && (
              <Text>
                <Text weight="semibold">How to apply:</Text> {job.howToApply}
              </Text>
            )}
          </VStack>
        </>
      )}
    </Dialog>
  );
}
