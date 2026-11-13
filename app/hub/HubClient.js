"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { TabList, Tab } from "@astryxdesign/core/TabList";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { Avatar } from "@astryxdesign/core/Avatar";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Divider } from "@astryxdesign/core/Divider";
import { Icon } from "@astryxdesign/core/Icon";
import PageHeader from "../../components/PageHeader";
import { WaveIllustration } from "../../components/brand/Illustration";
import { BriefcaseIcon, UsersIcon } from "../../lib/icons";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { EXPERIENCE_LEVELS } from "../../lib/gamification";
import { SERVICE_CATEGORIES } from "../../lib/serviceCategories";

const LEVEL_LABEL = Object.fromEntries(EXPERIENCE_LEVELS.map((l) => [l.id, l.label]));

function ProfileCard({ p }) {
  return (
    <Card padding={5}>
      <VStack gap={3}>
        <HStack gap={3} align="center">
          <Avatar name={p.display_name} size="md" tooltip={false} />
          <VStack gap={0}>
            <Text weight="bold">{p.display_name}</Text>
            <Text color="secondary">{p.title}</Text>
          </VStack>
        </HStack>
        {(p.industry || p.experience_level) && (
          <Text type="supporting" color="secondary">
            {[p.industry, p.experience_level ? LEVEL_LABEL[p.experience_level] : null].filter(Boolean).join(" · ")}
          </Text>
        )}
        {p.blurb && <Text>{p.blurb}</Text>}
        {(p.skills || []).length > 0 && (
          <HStack gap={1.5} wrap="wrap">
            {p.skills.map((s) => <Token key={s} label={s} size="sm" />)}
          </HStack>
        )}
        {((p.experience || []).length > 0 || (p.education || []).length > 0) && <Divider />}
        {(p.experience || []).length > 0 && (
          <VStack gap={1}>
            <Text type="supporting" weight="semibold" color="secondary">Experience</Text>
            {p.experience.map((e, i) => (
              <Text key={i} type="supporting">
                <Text type="supporting" weight="semibold">{e.role}</Text>
                {e.company ? ` · ${e.company}` : ""}
                {e.dates ? <Text type="supporting" color="secondary">{` — ${e.dates}`}</Text> : null}
              </Text>
            ))}
          </VStack>
        )}
        {(p.education || []).length > 0 && (
          <VStack gap={1}>
            <Text type="supporting" weight="semibold" color="secondary">Education</Text>
            {p.education.map((e, i) => (
              <Text key={i} type="supporting">
                <Text type="supporting" weight="semibold">{e.degree}</Text>
                {e.school ? ` · ${e.school}` : ""}
                {e.dates ? <Text type="supporting" color="secondary">{` — ${e.dates}`}</Text> : null}
              </Text>
            ))}
          </VStack>
        )}
      </VStack>
    </Card>
  );
}

function ServiceCard({ s }) {
  return (
    <Card padding={5}>
      <VStack gap={3} height="100%">
        <HStack>
          <Token label={s.category} size="sm" color="green" />
        </HStack>
        <Heading level={3}>{s.title}</Heading>
        <Text color="secondary" maxLines={4}>{s.description}</Text>
        <StackItem size="fill" />
        <Divider />
        <HStack justify="between" align="center" gap={2}>
          <VStack gap={0}>
            <Text weight="semibold">{s.hub_profiles?.display_name || "TumaCV member"}</Text>
            {s.delivery_days && <Text type="supporting" color="secondary">{s.delivery_days}-day delivery</Text>}
          </VStack>
          <Text size="lg" weight="bold">KES {s.price_kes.toLocaleString()}</Text>
        </HStack>
      </VStack>
    </Card>
  );
}

export default function HubClient() {
  const router = useRouter();
  const [view, setView] = useState("people");

  const [profiles, setProfiles] = useState(null);
  const [filter, setFilter] = useState("all");

  const [services, setServices] = useState(null);
  const [serviceCategory, setServiceCategory] = useState("all");
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceSort, setServiceSort] = useState("newest");

  useEffect(() => {
    supabaseBrowser().from("hub_profiles").select("*").order("updated_at", { ascending: false }).limit(300)
      .then(({ data }) => setProfiles(data || []));
  }, []);

  useEffect(() => {
    if (view !== "services" || services !== null) return;
    supabaseBrowser()
      .from("hub_services")
      .select("*, hub_profiles(display_name, title)")
      .order("created_at", { ascending: false })
      .limit(300)
      .then(({ data }) => setServices(data || []));
  }, [view, services]);

  const industriesPresent = profiles ? [...new Set(profiles.map((p) => p.industry).filter(Boolean))] : [];
  const filtered = profiles ? profiles.filter((p) => filter === "all" || p.industry === filter) : null;

  const categoriesPresent = services ? SERVICE_CATEGORIES.filter((c) => services.some((s) => s.category === c)) : [];
  let filteredServices = services
    ? services.filter((s) => {
        if (serviceCategory !== "all" && s.category !== serviceCategory) return false;
        if (!serviceQuery.trim()) return true;
        const q = serviceQuery.trim().toLowerCase();
        return s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q);
      })
    : null;
  if (filteredServices) {
    filteredServices = [...filteredServices].sort((a, b) => {
      if (serviceSort === "price-low") return a.price_kes - b.price_kes;
      if (serviceSort === "price-high") return b.price_kes - a.price_kes;
      return new Date(b.created_at) - new Date(a.created_at);
    });
  }

  return (
    <Layout
      height="auto"
      contentWidth={1120}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <PageHeader
              eyebrow="Open to work"
              title="Talent Hub"
              description="Kenyan professionals who've chosen to be found — browse by industry, or by the services they offer. Every profile is written by the person behind it."
              actions={<Button label="Add yourself" variant="primary" onClick={() => router.push("/dashboard")} />}
              tone="sand"
              illustration={<WaveIllustration size={200} hideOnPhones float />}
            />

            <TabList value={view} onChange={setView} hasDivider>
              <Tab value="people" label="People" />
              <Tab value="services" label="Services" />
            </TabList>

            {view === "people" && (
              <>
                {profiles && profiles.length > 0 && (
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
                ) : profiles.length === 0 ? (
                  <EmptyState
                    icon={<Icon icon={UsersIcon} size="lg" />}
                    title="No one has joined yet"
                    description="Be the first — publish a short public profile from your dashboard."
                    actions={<Button label="Join from your dashboard" variant="primary" onClick={() => router.push("/dashboard")} />}
                  />
                ) : filtered.length === 0 ? (
                  <Text color="secondary">No one in this industry yet.</Text>
                ) : (
                  <Grid columns={{ minWidth: 300 }} gap={4} align="start">
                    {filtered.map((p) => <ProfileCard key={p.id} p={p} />)}
                  </Grid>
                )}
              </>
            )}

            {view === "services" && (
              <>
                {services && services.length > 0 && (
                  <Grid columns={{ minWidth: 220 }} gap={3}>
                    <TextInput label="Search" placeholder="Search services…" value={serviceQuery} onChange={setServiceQuery} startIcon="search" hasClear />
                    <Selector
                      label="Category"
                      value={serviceCategory}
                      onChange={setServiceCategory}
                      options={[{ value: "all", label: "All categories" }, ...categoriesPresent.map((c) => ({ value: c, label: c }))]}
                    />
                    <Selector
                      label="Sort by"
                      value={serviceSort}
                      onChange={setServiceSort}
                      options={[
                        { value: "newest", label: "Newest" },
                        { value: "price-low", label: "Price: low to high" },
                        { value: "price-high", label: "Price: high to low" },
                      ]}
                    />
                  </Grid>
                )}
                {filteredServices === null ? (
                  <Center minHeight={200}><Spinner /></Center>
                ) : services.length === 0 ? (
                  <EmptyState
                    icon={<Icon icon={BriefcaseIcon} size="lg" />}
                    title="No services listed yet"
                    description="Offer a CV rewrite, a design job, tutoring — list it from your dashboard."
                    actions={<Button label="List a service" variant="primary" onClick={() => router.push("/dashboard")} />}
                  />
                ) : filteredServices.length === 0 ? (
                  <Text color="secondary">No services match that search.</Text>
                ) : (
                  <Grid columns={{ minWidth: 280 }} gap={4}>
                    {filteredServices.map((s) => <ServiceCard key={s.id} s={s} />)}
                  </Grid>
                )}
              </>
            )}
          </VStack>
        </LayoutContent>
      }
    />
  );
}
