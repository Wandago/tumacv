"use client";
import { useEffect, useState } from "react";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { Banner } from "@astryxdesign/core/Banner";
import { List, ListItem } from "@astryxdesign/core/List";
import { Badge } from "@astryxdesign/core/Badge";
import { EmptyState } from "@astryxdesign/core/EmptyState";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Icon } from "@astryxdesign/core/Icon";
import { Link } from "@astryxdesign/core/Link";
import PageHeader from "../../components/PageHeader";
import { PaperPlaneIllustration } from "../../components/brand/Illustration";
import { ArrowLeftIcon, LifeBuoyIcon, PlusIcon } from "../../lib/icons";
import { supabaseBrowser } from "../../lib/supabaseClient";

const TYPES = [
  { id: "bug", label: "Something's broken", emoji: "🐛" },
  { id: "suggestion", label: "I have an idea", emoji: "💡" },
  { id: "other", label: "Something else", emoji: "💬" },
];

export default function SupportClient() {
  const [user, setUser] = useState(undefined); // undefined = checking
  const [tickets, setTickets] = useState(null);
  const [selected, setSelected] = useState(null); // full ticket object with messages
  const [showNewForm, setShowNewForm] = useState(false);

  // new ticket form
  const [type, setType] = useState("bug");
  const [subject, setSubject] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  // reply box
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      const u = data?.user || null;
      setUser(u);
      if (u?.email) setEmail(u.email);
      if (u) loadTickets();
      else setShowNewForm(true); // logged-out visitors only ever see the form
    });
  }, []);

  async function loadTickets() {
    const { data } = await supabaseBrowser()
      .from("support_tickets")
      .select("*, support_ticket_messages(*)")
      .order("updated_at", { ascending: false });
    const sorted = (data || []).map((t) => ({
      ...t,
      support_ticket_messages: (t.support_ticket_messages || []).sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    }));
    setTickets(sorted);
  }

  async function openTicket(ticket) {
    setSelected(ticket);
    setShowNewForm(false);
  }

  async function submitNewTicket() {
    setErr("");
    if (message.trim().length < 10) {
      setErr("Add a bit more detail (at least 10 characters) so we can actually help.");
      return;
    }
    if (!email.trim()) {
      setErr("Please include an email so we can follow up.");
      return;
    }
    setBusy(true);
    try {
      const headers = { "content-type": "application/json" };
      if (user) {
        const { data: sess } = await supabaseBrowser().auth.getSession();
        headers.authorization = `Bearer ${sess?.session?.access_token}`;
      }
      const res = await fetch("/api/support", {
        method: "POST",
        headers,
        body: JSON.stringify({ type, subject, message, email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Could not send your message. Try again.");
      } else {
        setMessage("");
        setSubject("");
        if (user) {
          await loadTickets();
          setShowNewForm(false);
        } else {
          setErr(""); // handled by the "sent" view below via a simple flag
          setSelected({ justSentAnon: true });
        }
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    if (!selected || replyText.trim().length < 2) return;
    setReplyBusy(true);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const res = await fetch("/api/support/reply", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
        body: JSON.stringify({ ticketId: selected.id, message: replyText }),
      });
      if (res.ok) {
        setReplyText("");
        await loadTickets();
        const { data } = await supabaseBrowser()
          .from("support_tickets")
          .select("*, support_ticket_messages(*)")
          .eq("id", selected.id)
          .single();
        if (data) {
          data.support_ticket_messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
          setSelected(data);
        }
      }
    } finally {
      setReplyBusy(false);
    }
  }

  if (user === undefined) {
    return (
      <Center minHeight="60vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  const page = (children) => (
    <Layout height="auto" contentWidth={760} content={<LayoutContent padding={6} isScrollable={false}><VStack gap={6}>{children}</VStack></LayoutContent>} />
  );
  const form = (emailLocked) => (
    <NewTicketForm
      type={type} setType={setType} subject={subject} setSubject={setSubject}
      email={email} setEmail={setEmail} emailLocked={emailLocked}
      message={message} setMessage={setMessage}
      err={err} busy={busy} onSubmit={submitNewTicket}
    />
  );

  // ---- logged-out: form only ----
  if (!user) {
    return page(
      <>
        <PageHeader
          eyebrow="A real person replies"
          title="Help & feedback"
          description="Hit a bug, stuck on a payment, or have an idea? We read every message and reply to all of them."
          tone="peach"
          illustration={<PaperPlaneIllustration size={190} hideOnPhones float />}
        />
        <Card padding={6}>
          {selected?.justSentAnon ? (
            <VStack gap={3}>
              <Heading level={2}>Got it — thank you.</Heading>
              <Text color="secondary">
                We'll follow up at {email} once we've looked into it. <Link href="/login">Sign in or create an account</Link> to
                see replies and your ticket history here next time.
              </Text>
              <HStack>
                <Button label="Send another message" onClick={() => setSelected(null)} />
              </HStack>
            </VStack>
          ) : (
            form(false)
          )}
        </Card>
      </>
    );
  }

  // ---- logged-in: viewing one ticket's thread ----
  if (selected && !selected.justSentAnon) {
    return page(
      <>
        <VStack gap={3}>
          <HStack>
            <Button label="All tickets" variant="ghost" icon={<Icon icon={ArrowLeftIcon} />} onClick={() => setSelected(null)} />
          </HStack>
          <Heading level={1}>{selected.subject}</Heading>
          <HStack gap={2}>
            <Badge label={selected.type} />
            <Badge label={selected.status} variant={selected.status === "open" ? "success" : "neutral"} />
          </HStack>
        </VStack>

        <VStack gap={3}>
          {selected.support_ticket_messages.map((m) => (
            <HStack key={m.id} justify={m.sender === "admin" ? "start" : "end"}>
              <Card padding={4} variant={m.sender === "admin" ? "green" : "default"} maxWidth="85%">
                <VStack gap={1}>
                  <Text type="supporting" color="secondary">
                    {m.sender === "admin" ? "TumaCV support" : "You"} ·{" "}
                    {new Date(m.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </Text>
                  <Text textWrap="pretty">{m.message}</Text>
                </VStack>
              </Card>
            </HStack>
          ))}
        </VStack>

        <Card padding={4}>
          <VStack gap={3}>
            <TextArea label="Reply" isLabelHidden rows={3} placeholder="Write a reply…" value={replyText} onChange={setReplyText} />
            <HStack justify="end">
              <Button label="Send reply" variant="primary" isLoading={replyBusy} isDisabled={replyText.trim().length < 2} onClick={sendReply} />
            </HStack>
          </VStack>
        </Card>
      </>
    );
  }

  // ---- logged-in: ticket list + new ticket form ----
  return page(
    <>
      <HStack justify="between" align="center" wrap="wrap" gap={3}>
        <PageHeader title="Help & feedback" description="Your conversations with the TumaCV team." />
        <Button
          label={showNewForm ? "Close" : "New ticket"}
          variant={showNewForm ? "ghost" : "primary"}
          icon={showNewForm ? <Icon icon="close" /> : <Icon icon={PlusIcon} />}
          onClick={() => setShowNewForm(!showNewForm)}
        />
      </HStack>

      {showNewForm && <Card padding={6}>{form(true)}</Card>}

      {tickets === null ? (
        <Center minHeight={160}><Spinner /></Center>
      ) : tickets.length === 0 ? (
        !showNewForm && (
          <Card padding={2}>
            <EmptyState
              icon={<Icon icon={LifeBuoyIcon} size="lg" />}
              title="No tickets yet"
              description="Tap “New ticket” if you need help with anything — a real person replies."
            />
          </Card>
        )
      ) : (
        <Card padding={0}>
          <List hasDividers>
            {tickets.map((t) => {
              const last = t.support_ticket_messages[t.support_ticket_messages.length - 1];
              return (
                <ListItem
                  key={t.id}
                  label={t.subject}
                  description={last ? `${last.sender === "admin" ? "Support: " : "You: "}${last.message.slice(0, 80)}${last.message.length > 80 ? "…" : ""}` : ""}
                  endContent={<Badge label={t.status} variant={t.status === "open" ? "success" : "neutral"} />}
                  onClick={() => openTicket(t)}
                />
              );
            })}
          </List>
        </Card>
      )}
    </>
  );
}

function NewTicketForm({ type, setType, subject, setSubject, email, setEmail, emailLocked, message, setMessage, err, busy, onSubmit }) {
  return (
    <VStack gap={4}>
      <VStack gap={2}>
        <Text weight="medium">What's this about?</Text>
        <Grid columns={{ minWidth: 170 }} gap={2}>
          {TYPES.map((t) => (
            <SelectableCard key={t.id} label={t.label} isSelected={type === t.id} onChange={() => setType(t.id)} padding={3}>
              <Text>{t.emoji} {t.label}</Text>
            </SelectableCard>
          ))}
        </Grid>
      </VStack>
      <TextInput label="Subject" isOptional value={subject} onChange={setSubject} placeholder="A short summary" />
      <TextInput
        type="email"
        label="Your email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        isReadOnly={emailLocked}
        description={emailLocked ? "Using your account email." : "So we can reply to you."}
      />
      <TextArea
        label="Tell us what's going on"
        rows={6}
        value={message}
        onChange={setMessage}
        placeholder={type === "bug" ? "What happened? What did you expect instead?" : type === "suggestion" ? "What would make TumaCV better for you?" : "What's on your mind?"}
      />
      {err && <Banner status="error" title={err} />}
      <HStack>
        <Button label="Send message" variant="primary" isLoading={busy} onClick={onSubmit} />
      </HStack>
    </VStack>
  );
}
