"use client";
import { useEffect, useState } from "react";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Icon } from "@astryxdesign/core/Icon";
import { supabaseBrowser } from "../lib/supabaseClient";
import { referralLink } from "../lib/referral";
import { REFERRAL_CREDITS } from "../lib/plans";
import ShareButtons from "./ShareButtons";
import { GiftIcon } from "../lib/icons";

export default function ReferralCard({ user }) {
  const [count, setCount] = useState(null);
  const [statsErr, setStatsErr] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data: sess } = await supabaseBrowser().auth.getSession();
        const res = await fetch("/api/account/referral-stats", {
          headers: { authorization: `Bearer ${sess?.session?.access_token}` },
        });
        if (!res.ok) { setStatsErr(true); return; }
        const data = await res.json();
        setCount(data.count);
      } catch {
        setStatsErr(true);
      }
    })();
  }, [user]);

  if (!user) return null;
  const link = referralLink(user.id);
  const message = `Get ${REFERRAL_CREDITS} free bonus applications on TumaCV — tailored CVs + cover letters in minutes:`;

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack gap={3} align="start">
          <Icon icon={GiftIcon} color="accent" size="lg" />
          <StackItem size="fill">
            <VStack gap={1}>
              <Heading level={3}>Invite friends, earn applications</Heading>
              <Text color="secondary">
                Each friend who signs up with your link gets {REFERRAL_CREDITS} bonus applications on top of their free
                ones, and you get {REFERRAL_CREDITS} more too. No limit.
              </Text>
            </VStack>
          </StackItem>
        </HStack>
        <TextInput label="Your link" value={link} onChange={() => {}} isReadOnly />
        <ShareButtons url={link} message={message} />
        <Text type="supporting" color="secondary">
          {statsErr
            ? "Couldn't load your referral count just now — your link still works."
            : count === null
            ? ""
            : count === 0
            ? "No referrals yet — share your link to start earning."
            : `${count} friend${count === 1 ? "" : "s"} joined through your link so far.`}
        </Text>
      </VStack>
    </Card>
  );
}
