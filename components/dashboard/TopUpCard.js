"use client";
import { useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Grid } from "@astryxdesign/core/Grid";
import { ClickableCard } from "@astryxdesign/core/ClickableCard";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Banner } from "@astryxdesign/core/Banner";
import { Collapsible } from "@astryxdesign/core/Collapsible";
import { Divider } from "@astryxdesign/core/Divider";
import { Spinner } from "@astryxdesign/core/Spinner";
import GlobalPayHelp from "../GlobalPayHelp";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { PLANS, MPESA_ENABLED, PADDLE_ENABLED, DARAJA_ENABLED, FREE_SIGNUP_CREDITS, toUsd } from "../../lib/plans";
import { openPaddleCheckout, paddlePriceIdFor } from "../../lib/paddle";

async function authHeaders() {
  const { data: sess } = await supabaseBrowser().auth.getSession();
  return { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` };
}

// Buying credits: M-Pesa/Airtel via IntaSend, card via Paddle, direct M-Pesa
// STK push via Daraja — whichever are switched on in lib/plans.js — plus
// promo codes. `onPaymentStarted` lets the dashboard poll for the credits.
export default function TopUpCard({ user, onPaymentStarted, onCreditsChanged }) {
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [mpesaBusy, setMpesaBusy] = useState(false);
  const [mpesaMsg, setMpesaMsg] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [promoMsg, setPromoMsg] = useState("");
  const [promoErr, setPromoErr] = useState("");

  async function buy(planId) {
    setErr("");
    setBuying(planId);
    try {
      if (MPESA_ENABLED) {
        const res = await fetch("/api/checkout", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ planId }) });
        const data = await res.json();
        if (!res.ok) setErr(data.error || "Could not start the payment.");
        else window.location.href = data.url;
      } else if (PADDLE_ENABLED) {
        const { data: sess } = await supabaseBrowser().auth.getSession();
        await openPaddleCheckout({ planId, userId: user.id, email: sess?.session?.user?.email });
        // Card payment confirms via webhook, not a redirect — poll for the credits.
        onPaymentStarted();
      }
    } catch (e) {
      setErr(e.message || "Network error. Try again.");
    } finally {
      setBuying("");
    }
  }

  async function payWithMpesa(planId) {
    setErr("");
    setMpesaMsg("");
    if (!mpesaPhone.trim()) {
      setErr("Enter your M-Pesa phone number first.");
      return;
    }
    setMpesaBusy(true);
    try {
      const res = await fetch("/api/checkout-mpesa", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ planId, phone: mpesaPhone }) });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Could not send the M-Pesa prompt.");
      else {
        setMpesaMsg(data.message);
        onPaymentStarted();
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setMpesaBusy(false);
    }
  }

  async function redeemCode() {
    setPromoErr("");
    setPromoMsg("");
    if (!promoCode.trim()) {
      setPromoErr("Enter a code first.");
      return;
    }
    setPromoBusy(true);
    try {
      const res = await fetch("/api/account/redeem-code", { method: "POST", headers: await authHeaders(), body: JSON.stringify({ code: promoCode }) });
      const data = await res.json();
      if (!res.ok) setPromoErr(data.error || "Could not redeem that code.");
      else {
        setPromoMsg(`+${data.credits} applications added!`);
        setPromoCode("");
        onCreditsChanged();
      }
    } catch {
      setPromoErr("Network error. Try again.");
    } finally {
      setPromoBusy(false);
    }
  }

  const paymentsLive = MPESA_ENABLED || PADDLE_ENABLED;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={3}>Top up</Heading>
          <Text color="secondary">
            {MPESA_ENABLED
              ? "One-off top-ups with M-Pesa or Airtel Money. Nothing renews."
              : PADDLE_ENABLED
              ? "Pay by Visa/Mastercard. M-Pesa and Airtel Money are coming back soon."
              : `Paid plans are launching very soon — we're finishing M-Pesa payment approval. Your ${FREE_SIGNUP_CREDITS} free applications still work in the meantime.`}
          </Text>
        </VStack>

        {paymentsLive && (
          <Grid columns={{ minWidth: 220 }} gap={3}>
            {Object.values(PLANS).map((p) => (
              <ClickableCard
                key={p.id}
                label={`${p.name}: ${p.blurb} for KES ${p.priceKes}`}
                onClick={() => buy(p.id)}
                isDisabled={!!buying || (!MPESA_ENABLED && !paddlePriceIdFor(p.id))}
                padding={4}
                variant={p.id === "plus" ? "green" : "default"}
              >
                <VStack gap={1}>
                  <HStack justify="between" align="center">
                    <Text weight="semibold">{p.name}</Text>
                    {buying === p.id && <Spinner size="sm" />}
                  </HStack>
                  <Text size="xl" weight="bold">KES {p.priceKes}</Text>
                  {!MPESA_ENABLED && <Text type="supporting" color="secondary">≈ ${toUsd(p.priceKes)}</Text>}
                  <Text type="supporting" color="secondary">{p.blurb}</Text>
                </VStack>
              </ClickableCard>
            ))}
          </Grid>
        )}

        {!MPESA_ENABLED && PADDLE_ENABLED && (
          <Collapsible defaultIsOpen={false} trigger={<Text weight="semibold">Only have M-Pesa? Here's how to pay anyway</Text>}>
            <GlobalPayHelp />
          </Collapsible>
        )}

        {DARAJA_ENABLED && (
          <VStack gap={3}>
            <Divider label="or pay directly with M-Pesa" />
            <TextInput label="M-Pesa phone number" placeholder="07XX XXX XXX" value={mpesaPhone} onChange={setMpesaPhone} width={240} />
            <HStack gap={2} wrap="wrap">
              {Object.values(PLANS).map((p) => (
                <Button key={p.id} label={`${p.name} — KES ${p.priceKes}`} isDisabled={mpesaBusy} onClick={() => payWithMpesa(p.id)} />
              ))}
            </HStack>
            {mpesaMsg && <Banner status="success" title={mpesaMsg} />}
          </VStack>
        )}

        {err && <Banner status="error" title={err} />}

        <Divider />
        <HStack gap={2} align="end">
          <StackItem size="fill">
            <TextInput
              label="Promo code"
              placeholder="e.g. TIKTOK5"
              value={promoCode}
              onChange={(v) => setPromoCode(v.toUpperCase())}
              status={promoErr ? { type: "error", message: promoErr } : promoMsg ? { type: "success", message: promoMsg } : undefined}
            />
          </StackItem>
          <Button label="Redeem" isLoading={promoBusy} onClick={redeemCode} />
        </HStack>
      </VStack>
    </Card>
  );
}
