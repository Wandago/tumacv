"use client";
import { useState } from "react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { List, ListItem } from "@astryxdesign/core/List";
import { Button } from "@astryxdesign/core/Button";
import { Banner } from "@astryxdesign/core/Banner";
import { VStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { Spinner } from "@astryxdesign/core/Spinner";
import { supabaseBrowser } from "../lib/supabaseClient";
import { PLANS, MPESA_ENABLED, PADDLE_ENABLED, toUsd } from "../lib/plans";
import { openPaddleCheckout, paddlePriceIdFor } from "../lib/paddle";

export default function CreditsModal({ onClose, user }) {
  const [buying, setBuying] = useState("");
  const [err, setErr] = useState("");
  const paymentsLive = MPESA_ENABLED || PADDLE_ENABLED;

  async function buy(planId) {
    setErr("");
    setBuying(planId);
    try {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      if (MPESA_ENABLED) {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (!res.ok) setErr(data.error || "Could not start the payment.");
        else window.location.href = data.url;
      } else if (PADDLE_ENABLED) {
        await openPaddleCheckout({ planId, userId: user?.id, email: sess?.session?.user?.email });
      }
    } catch (e) {
      setErr(e.message || "Network error. Try again.");
    } finally {
      setBuying("");
    }
  }

  return (
    <Dialog isOpen onOpenChange={(open) => !open && onClose()} width={460}>
      <Layout
        height="auto"
        header={<DialogHeader title="You're out of applications" onOpenChange={(open) => !open && onClose()} />}
        content={
          <LayoutContent padding={4}>
            <VStack gap={4}>
              <Text color="secondary">
                {paymentsLive
                  ? "Nice progress — you've used up your applications. Top up to keep tailoring your CV for more jobs. Your work is saved; nothing is lost."
                  : "Nice progress — you've used up your free applications. We're finishing M-Pesa payment approval so everyone can top up directly; paid plans launch very soon. Your work is saved; nothing is lost."}
              </Text>
              {paymentsLive && (
                <List hasDividers>
                  {Object.values(PLANS).map((p) => (
                    <ListItem
                      key={p.id}
                      label={p.name}
                      description={p.blurb}
                      isDisabled={!!buying || (PADDLE_ENABLED && !MPESA_ENABLED && !paddlePriceIdFor(p.id))}
                      onClick={() => buy(p.id)}
                      endContent={
                        buying === p.id ? (
                          <Spinner size="sm" />
                        ) : (
                          <VStack gap={0} hAlign="end">
                            <Text weight="bold">KES {p.priceKes}</Text>
                            {PADDLE_ENABLED && !MPESA_ENABLED && (
                              <Text type="supporting" color="secondary">≈ ${toUsd(p.priceKes)}</Text>
                            )}
                          </VStack>
                        )
                      }
                    />
                  ))}
                </List>
              )}
              {err && <Banner status="error" title={err} />}
              {paymentsLive && (
                <Text type="supporting" color="secondary">
                  {MPESA_ENABLED
                    ? "Pay with M-Pesa or Airtel Money. One-off top-up — nothing renews."
                    : "Pay by Visa/Mastercard. Only have M-Pesa? Your dashboard has the GlobalPay card guide."}
                </Text>
              )}
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter hasDivider>
            <Button label={paymentsLive ? "Maybe later" : "Got it"} variant="secondary" onClick={onClose} />
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
