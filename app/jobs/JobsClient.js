"use client";
import { useCallback, useEffect, useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import Tile from "../../components/brand/Tile";
import Accent from "../../components/brand/Accent";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { SegmentedControl, SegmentedControlItem } from "@astryxdesign/core/SegmentedControl";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Skeleton } from "@astryxdesign/core/Skeleton";
import { Icon } from "@astryxdesign/core/Icon";
import { Banner } from "@astryxdesign/core/Banner";
import JobList from "../../components/jobs/JobList";
import JobDetail from "../../components/jobs/JobDetail";
import PostJobDialog from "../../components/jobs/PostJobDialog";
import useOneTapApply from "../../components/jobs/useOneTapApply";
import { ApplyScreen, ApplyDialogs } from "../../components/jobs/ApplyFlow";
import { JobSearchIllustration } from "../../components/brand/Illustration";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { BriefcaseIcon, PlusIcon } from "../../lib/icons";

const POPULAR = ["Sales", "Customer service", "Accounting", "Marketing", "Data", "Software", "Admin", "NGO", "Logistics", "Teaching"];
const PAGE = 20;

export default function JobsClient() {
  const [user, setUser] = useState(null);
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [shown, setShown] = useState(PAGE);
  const [open, setOpen] = useState(null);
  const [posting, setPosting] = useState(false);
  const flow = useOneTapApply(user);

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data: d }) => setUser(d?.user || null));
    const initial = new URLSearchParams(window.location.search).get("q");
    if (initial) {
      setQ(initial);
      setQuery(initial);
    }
  }, []);

  const load = useCallback(async () => {
    setData(null);
    setErr("");
    setShown(PAGE);
    try {
      const res = await fetch(`/api/jobs?${new URLSearchParams({ q: query, scope })}`);
      if (!res.ok) throw new Error();
      setData(await res.json());
    } catch {
      setErr("Couldn't load jobs right now. Check your connection and try again.");
      setData({ jobs: [], sources: [] });
    }
  }, [query, scope]);

  useEffect(() => {
    load();
  }, [load]);

  function search(term) {
    setQ(term);
    setQuery(term.trim());
  }

  function apply(job) {
    setOpen(null);
    flow.begin(job);
  }

  const screen = <ApplyScreen flow={flow} onBack={() => { flow.reset(); window.scrollTo({ top: 0 }); }} />;
  if (flow.state.phase === "generating" || flow.state.phase === "done") return screen;

  const jobs = data?.jobs || [];
  const live = (data?.sources || []).filter((s) => s.ok && s.count > 0).map((s) => s.name);

  return (
    <Layout
      height="auto"
      contentWidth={1120}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <Tile tone="ink" padding={10}>
              <HStack gap={6} align="center">
                <StackItem size="fill">
                  <VStack gap={5}>
                    <VStack gap={2}>
                      <Text weight="semibold" color="secondary">Jobs · updated all day</Text>
                      <Heading level={1} type="display-1" textWrap="balance">Find it. <Accent>Tailor it.</Accent> Apply.</Heading>
                      <Text type="large" color="secondary" textWrap="pretty">
                        Live jobs from across the web — in Kenya and remote roles open to Kenyans. Tap “Tailor &amp; apply”
                        and your CV and cover letter are rewritten for that job in about a minute.
                      </Text>
                    </VStack>
                    <HStack
                      as="form"
                      gap={2}
                      align="end"
                      onSubmit={(e) => {
                        e.preventDefault();
                        search(q);
                      }}
                    >
                      <StackItem size="fill">
                        <TextInput label="Search jobs" isLabelHidden size="lg" startIcon="search" placeholder="Job title, skill or company" value={q} onChange={setQ} hasClear />
                      </StackItem>
                      <Button label="Search" variant="primary" size="lg" type="submit" />
                    </HStack>
                    <SegmentedControl label="Where" value={scope} onChange={setScope}>
                      <SegmentedControlItem value="all" label="Everywhere" />
                      <SegmentedControlItem value="kenya" label="In Kenya" />
                      <SegmentedControlItem value="remote" label="Remote" />
                    </SegmentedControl>
                  </VStack>
                </StackItem>
                <JobSearchIllustration size={230} hideOnPhones float />
              </HStack>
            </Tile>

            <HStack gap={2} wrap="wrap" align="center">
              <Text color="secondary" weight="medium">Popular:</Text>
              {POPULAR.map((p) => (
                <Button key={p} label={p} size="sm" variant={query.toLowerCase() === p.toLowerCase() ? "primary" : "secondary"} onClick={() => search(p)} />
              ))}
            </HStack>

            <HStack justify="between" align="end" gap={3} wrap="wrap">
              <VStack gap={0}>
                <Heading level={2}>
                  {data === null ? "Finding jobs…" : `${jobs.length} ${jobs.length === 1 ? "job" : "jobs"}${query ? ` for “${query}”` : ""}`}
                </Heading>
                {live.length > 0 && <Text type="supporting" color="secondary">From {live.join(", ")}. Each listing links to its source.</Text>}
              </VStack>
              <Button
                label="Hiring? Post a job free"
                variant="ghost"
                icon={<Icon icon={PlusIcon} />}
                onClick={() => (user ? setPosting(true) : (window.location.href = "/login"))}
              />
            </HStack>

            {err && <Banner status="error" title={err} endContent={<Button size="sm" label="Try again" onClick={load} />} />}

            {data === null ? (
              <Card padding={5}>
                <VStack gap={4}>
                  {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} height={44} />)}
                </VStack>
              </Card>
            ) : jobs.length === 0 ? (
              <EmptyState
                icon={<Icon icon={BriefcaseIcon} size="lg" />}
                title={query ? `No jobs for “${query}” right now` : "No jobs right now"}
                description="Try a broader search, or switch between In Kenya and Remote."
                actions={query ? <Button label="Clear search" onClick={() => search("")} /> : undefined}
              />
            ) : (
              <VStack gap={4}>
                <Card padding={0}>
                  <JobList jobs={jobs.slice(0, shown)} onOpen={setOpen} onApply={apply} />
                </Card>
                {shown < jobs.length && (
                  <HStack justify="center">
                    <Button label={`Show more (${jobs.length - shown})`} onClick={() => setShown((n) => n + PAGE)} />
                  </HStack>
                )}
              </VStack>
            )}
          </VStack>

          <JobDetail job={open} onClose={() => setOpen(null)} onApply={apply} />
          <ApplyDialogs flow={flow} user={user} />
          {user && (
            <PostJobDialog
              isOpen={posting}
              onClose={() => setPosting(false)}
              user={user}
              onPosted={() => {
                setPosting(false);
                load();
              }}
            />
          )}
        </LayoutContent>
      }
    />
  );
}
