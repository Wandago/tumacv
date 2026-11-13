"use client";
import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Icon } from "@astryxdesign/core/Icon";
import JobList from "../jobs/JobList";
import { ArrowRightIcon } from "../../lib/icons";

// A search term for "jobs like the ones you apply to": the role from the
// latest application ("Sales Executive — Safaricom" → "Sales Executive"),
// else the first word of the user's industry.
function searchTerm(history, profile) {
  const last = (history[0]?.job_title || "").split(/\s[—–-]\s|\sat\s/)[0].trim();
  if (last && last.length <= 40) return last.split(/\s+/).slice(0, 3).join(" ");
  return (profile?.industry || "").split(/[\s&,/]+/)[0] || "";
}

// Four fresh jobs matched to what the user applies for, each one tap from a
// tailored application.
export default function JobsForYou({ history, profile, onApply }) {
  const term = searchTerm(history, profile);
  const [jobs, setJobs] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/jobs?${new URLSearchParams({ q: term, scope: "all" })}`)
      .then((r) => (r.ok ? r.json() : { jobs: [] }))
      .then((d) => !cancelled && setJobs((d.jobs || []).slice(0, 4)))
      .catch(() => !cancelled && setJobs([]));
    return () => {
      cancelled = true;
    };
  }, [term]);

  if (jobs && jobs.length === 0) return null;
  const more = `/jobs${term ? `?${new URLSearchParams({ q: term })}` : ""}`;

  return (
    <Card variant="gray" padding={0}>
      <VStack gap={0}>
        <HStack justify="between" align="end" gap={3} wrap="wrap" padding={6}>
          <VStack gap={1}>
            <Text color="secondary" weight="semibold">Jobs for you{term ? ` · ${term}` : ""}</Text>
            <Heading level={2} type="display-3">Ready to tailor in one tap</Heading>
          </VStack>
          <Button label="See all jobs" variant="ghost" endContent={<Icon icon={ArrowRightIcon} />} href={more} />
        </HStack>
        {jobs === null ? (
          <VStack gap={3} padding={6}>
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} height={40} />)}
          </VStack>
        ) : (
          <JobList jobs={jobs} compact onOpen={() => (window.location.href = more)} onApply={onApply} />
        )}
      </VStack>
    </Card>
  );
}
