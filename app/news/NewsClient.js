"use client";
import { useEffect, useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Selector } from "@astryxdesign/core/Selector";
import { Token } from "@astryxdesign/core/Token";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Icon } from "@astryxdesign/core/Icon";
import PageHeader from "../../components/PageHeader";
import { TargetIllustration } from "../../components/brand/Illustration";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { NewspaperIcon } from "../../lib/icons";

const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });

export default function NewsClient() {
  const [articles, setArticles] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    supabaseBrowser().from("articles").select("*").order("created_at", { ascending: false }).limit(100)
      .then(({ data }) => setArticles(data || []));
  }, []);

  const industriesPresent = articles ? [...new Set(articles.map((a) => a.industry).filter(Boolean))] : [];
  const filtered = articles ? articles.filter((a) => filter === "all" || a.industry === filter) : null;

  return (
    <Layout
      height="auto"
      contentWidth={1120}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <PageHeader
              eyebrow="News & insights"
              title="Career advice for the Kenyan job market"
              description="Fresh, specific guidance — written daily, one article at a time."
              tone="butter"
              illustration={<TargetIllustration size={190} hideOnPhones float />}
            />
            {articles && articles.length > 0 && (
              <Selector
                label="Industry"
                width={300}
                value={filter}
                onChange={setFilter}
                options={[{ value: "all", label: "All industries" }, ...industriesPresent.map((i) => ({ value: i, label: i }))]}
              />
            )}
            {filtered === null ? (
              <Center minHeight={200}><Spinner /></Center>
            ) : filtered.length === 0 ? (
              <EmptyState
                icon={<Icon icon={NewspaperIcon} size="lg" />}
                title="No articles yet"
                description="Check back soon — new ones are published daily."
              />
            ) : (
              <Grid columns={{ minWidth: 300 }} gap={4}>
                {filtered.map((a) => (
                  <ClickableCard key={a.id} label={a.title} href={`/news/${a.id}`} padding={5}>
                    <VStack gap={3} height="100%">
                      <HStack justify="between" align="center" gap={2}>
                        <Token label={a.industry} size="sm" color="pink" />
                        <Text type="supporting" color="secondary">{fmtDate(a.created_at)}</Text>
                      </HStack>
                      <Heading level={3}>{a.title}</Heading>
                      <Text color="secondary" maxLines={3}>{a.content?.slice(0, 220)}</Text>
                      <StackItem size="fill" />
                      <Text color="accent" weight="semibold">Read article →</Text>
                    </VStack>
                  </ClickableCard>
                ))}
              </Grid>
            )}
          </VStack>
        </LayoutContent>
      }
    />
  );
}
