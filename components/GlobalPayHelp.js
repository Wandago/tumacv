"use client";
import { VStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { List, ListItem } from "@astryxdesign/core/List";
import { Link } from "@astryxdesign/core/Link";
import { Card } from "@astryxdesign/core/Card";

const SETUP = [
  "Open the M-Pesa app → tap Grow → select GlobalPay.",
  "Tap Activate, choose a card colour, and enter your M-Pesa PIN.",
  "You'll get a 16-digit card number, expiry and CVV — tap “Show CVV” when you're ready to pay.",
];
const PAYING = [
  "Make sure your M-Pesa balance covers the amount — the card spends straight from your wallet.",
  "Tap a plan to open checkout, choose Card, and enter your GlobalPay card number, expiry and CVV.",
  "Use your name exactly as it appears on your M-Pesa registration as the cardholder name.",
];

export default function GlobalPayHelp() {
  return (
    <Card variant="muted" padding={5}>
      <VStack gap={4}>
        <VStack gap={1}>
          <Heading level={3}>Using M-Pesa GlobalPay to pay by card</Heading>
          <Text color="secondary">
            Safaricom's M-Pesa app can generate a free virtual Visa card funded straight from your M-Pesa balance —
            no bank account needed. It works on international sites like this one.
          </Text>
        </VStack>
        <VStack gap={2}>
          <Text weight="semibold">Get your virtual card (one-time setup)</Text>
          <List listStyle="decimal" density="compact">
            {SETUP.map((s) => <ListItem key={s} label={s} />)}
          </List>
          <Text type="supporting" color="secondary">
            No app? Dial *334# → Lipa na M-Pesa → M-Pesa GlobalPay → Opt-In → enter your PIN. Card details arrive by SMS.
          </Text>
        </VStack>
        <VStack gap={2}>
          <Text weight="semibold">Paying on TumaCV</Text>
          <List listStyle="decimal" density="compact">
            {PAYING.map((s) => <ListItem key={s} label={s} />)}
          </List>
        </VStack>
        <Text color="secondary">
          A small forex fee applies (Safaricom's, not TumaCV's) since the charge settles in USD. Details:{" "}
          <Link href="https://www.safaricom.co.ke/mpesaglobalpay/about" isExternalLink>safaricom.co.ke/mpesaglobalpay</Link>
        </Text>
      </VStack>
    </Card>
  );
}
