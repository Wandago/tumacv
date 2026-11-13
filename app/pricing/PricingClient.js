"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { Token } from "@astryxdesign/core/Token";
import { Icon } from "@astryxdesign/core/Icon";
import { List, ListItem } from "@astryxdesign/core/List";
import { Collapsible, CollapsibleGroup } from "@astryxdesign/core/Collapsible";
import GlobalPayHelp from "../../components/GlobalPayHelp";
import PageHeader from "../../components/PageHeader";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { PLANS, FREE_MODE, FREE_SIGNUP_CREDITS, MPESA_ENABLED, PADDLE_ENABLED, toUsd } from "../../lib/plans";
import { openPaddleCheckout, paddlePriceIdFor } from "../../lib/paddle";

const FAQ = [
  {
    q: "Why per-application instead of a subscription?",
    a: "Job hunting has a natural end — the day you get hired, you stop needing this. A subscription would keep charging you anyway. Pay only for what you use.",
  },
  {
    q: "How do I pay?",
    a: MPESA_ENABLED
      ? "M-Pesa (STK push straight to your phone), Airtel Money, or Visa/Mastercard — pick whichever's easiest at checkout."
      : PADDLE_ENABLED
      ? "Visa/Mastercard right now. Only have M-Pesa? See the GlobalPay guide below the plans — it lets you pay with a virtual card funded from your M-Pesa balance. Direct M-Pesa and Airtel Money are coming back soon."
      : "We're finishing M-Pesa payment approval so everyone can pay directly — paid plans launch very soon. Your free applications work in the meantime.",
  },
  {
    q: "Do unused applications expire?",
    a: "No. None of the plans expire — buy a bundle and use it whenever you need it.",
  },
  {
    q: "What counts as one application?",
    a: "One tailored CV + cover letter for one job posting. Regenerating the same job with edits doesn't cost extra credits within the same session.",
  },
];

export default function PricingClient() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const paymentsLive = MPESA_ENABLED || PADDLE_ENABLED;

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => setUser(data?.user || null));
  }, []);

  async function buy(planId) {
    if (!user) {
      router.push("/login");
      return;
    }
    setErr("");
    setBuying(planId);
    try {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Could not start the payment.");
      else window.location.href = data.url;
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBuying("");
    }
  }

  async function payWithCard(planId) {
    if (!user) {
      router.push("/login");
      return;
    }
    setErr("");
    setBuying(planId);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      await openPaddleCheckout({ planId, userId: user.id, email: sess?.session?.user?.email });
    } catch (e) {
      setErr(e.message || "Could not open card checkout.");
    } finally {
      setBuying("");
    }
  }

  const buttonLabel = (p) =>
    FREE_MODE ? "Free right now" : !paymentsLive ? "Coming soon" : user ? "Buy now" : "Sign in to buy";
  const perApp = (p) => (p.priceKes / p.credits).toFixed(2);

  return (
    <Layout
      height="auto"
      contentWidth={1040}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={8}>
            <PageHeader
              isCentered
              eyebrow="No subscriptions, ever"
              title="Pay only for the applications you send"
              description={`Top up once and the credits are yours — nothing renews, nothing expires. You start with ${FREE_SIGNUP_CREDITS} free the moment you sign up.`}
            />

            {FREE_MODE ? (
              <Banner status="success" title="TumaCV is completely free during beta" description="Every signed-in account gets unlimited applications. Pricing below kicks in after beta." />
            ) : !paymentsLive ? (
              <Banner status="info" title="Paid plans are launching very soon" description={`We're finishing M-Pesa payment approval so everyone can top up directly. Your ${FREE_SIGNUP_CREDITS} free applications work right now.`} />
            ) : null}

            <Grid columns={{ minWidth: 220 }} gap={4}>
              <Card padding={6} variant="muted">
                <VStack gap={3}>
                  <HStack justify="between" align="center">
                    <Heading level={3}>Free</Heading>
                    <Token label="On signup" size="sm" />
                  </HStack>
                  <Text size="3xl" weight="bold">KES 0</Text>
                  <Text color="secondary">{FREE_SIGNUP_CREDITS} applications to try it properly — no card needed.</Text>
                  <Button label={user ? "Start an application" : "Create a free account"} onClick={() => router.push(user ? "/" : "/login?mode=signup")} width="100%" />
                </VStack>
              </Card>
              {Object.values(PLANS).map((p) => (
                <Card key={p.id} padding={6} variant={p.id === "plus" ? "green" : "default"} elevation={p.id === "plus" ? "med" : "none"}>
                  <VStack gap={3}>
                    <HStack justify="between" align="center">
                      <Heading level={3}>{p.name}</Heading>
                      {p.id === "plus" && <Token label="Most popular" size="sm" color="green" />}
                    </HStack>
                    <VStack gap={0}>
                      <Text size="3xl" weight="bold">KES {p.priceKes}</Text>
                      {PADDLE_ENABLED && !MPESA_ENABLED && <Text type="supporting" color="secondary">≈ ${toUsd(p.priceKes)}</Text>}
                    </VStack>
                    <Text color="secondary">{p.blurb} · about KES {perApp(p)} each</Text>
                    <Button
                      label={buttonLabel(p)}
                      variant="primary"
                      width="100%"
                      isLoading={buying === p.id}
                      isDisabled={FREE_MODE || !paymentsLive || (PADDLE_ENABLED && !MPESA_ENABLED && !paddlePriceIdFor(p.id))}
                      onClick={() => (MPESA_ENABLED ? buy(p.id) : PADDLE_ENABLED ? payWithCard(p.id) : undefined)}
                    />
                  </VStack>
                </Card>
              ))}
            </Grid>

            {err && <Banner status="error" title={err} />}

            <List density="compact">
              {[
                MPESA_ENABLED ? "Pay with M-Pesa or Airtel Money." : PADDLE_ENABLED ? "Pay by Visa/Mastercard." : "M-Pesa and Airtel Money once payments are live.",
                "One application = one tailored CV + cover letter for one job.",
                "None of the plans expire.",
              ].map((line) => (
                <ListItem key={line} label={line} startContent={<Icon icon="check" color="success" />} />
              ))}
            </List>

            {PADDLE_ENABLED && !MPESA_ENABLED && (
              <Collapsible defaultIsOpen={false} trigger={<Text weight="semibold">Only have M-Pesa? Here's how to pay anyway</Text>}>
                <GlobalPayHelp />
              </Collapsible>
            )}

            <VStack gap={4}>
              <Heading level={2}>Common questions</Heading>
              <Card padding={2}>
                <CollapsibleGroup hasDividers>
                  {FAQ.map((f) => (
                    <Collapsible key={f.q} value={f.q} trigger={<Text weight="semibold">{f.q}</Text>}>
                      <Text color="secondary">{f.a}</Text>
                    </Collapsible>
                  ))}
                </CollapsibleGroup>
              </Card>
            </VStack>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
