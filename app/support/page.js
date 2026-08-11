"use client";
import { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

const TYPES = [
  { id: "bug", label: "Something's broken", emoji: "🐛" },
  { id: "suggestion", label: "I have an idea", emoji: "💡" },
  { id: "other", label: "Something else", emoji: "💬" },
];

export default function Support() {
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

  if (user === undefined) return null;

  // ---- logged-out: form only ----
  if (!user) {
    return (
      <main className="shell">
        <Nav />
        <section className="hero" style={{ paddingBottom: 6 }}>
          <span className="eyebrow">We're here to help</span>
          <h1>Help & feedback</h1>
          <p>Hit a bug, have an idea, or just want to tell us something? We read every message.</p>
        </section>
        <div className="step">
          {selected?.justSentAnon ? (
            <>
              <h2 style={{ marginBottom: 8 }}>Got it — thank you.</h2>
              <p className="step-hint" style={{ marginBottom: 14 }}>
                We'll follow up at {email} once we've looked into it.{" "}
                <a href="/login">Sign in or create an account</a> to see replies and your full ticket history here next time.
              </p>
              <button className="btn-ghost" onClick={() => setSelected(null)}>Send another message</button>
            </>
          ) : (
            <NewTicketForm
              type={type} setType={setType} subject={subject} setSubject={setSubject}
              email={email} setEmail={setEmail} emailLocked={false}
              message={message} setMessage={setMessage}
              err={err} busy={busy} onSubmit={submitNewTicket}
            />
          )}
        </div>
      </main>
    );
  }

  // ---- logged-in: viewing one ticket's thread ----
  if (selected && !selected.justSentAnon) {
    return (
      <main className="shell">
        <Nav />
        <div className="results-head">
          <h2>{selected.subject}</h2>
          <button className="btn-ghost" onClick={() => setSelected(null)}>← All tickets</button>
        </div>
        <div className="ticket-meta-row">
          <span className="credits-pill">{selected.type}</span>
          <span className={`credits-pill ${selected.status === "open" ? "" : "danger-pill"}`}>{selected.status}</span>
        </div>

        <div className="ticket-thread">
          {selected.support_ticket_messages.map((m) => (
            <div key={m.id} className={`ticket-bubble ${m.sender}`}>
              <div className="ticket-bubble-meta">{m.sender === "admin" ? "TumaCV support" : "You"} · {new Date(m.created_at).toLocaleString("en-KE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
              <div className="ticket-bubble-text">{m.message}</div>
            </div>
          ))}
        </div>

        <div className="ticket-reply-box">
          <textarea
            placeholder="Write a reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            style={{ minHeight: 80 }}
          />
          <button className="btn-primary" onClick={sendReply} disabled={replyBusy || replyText.trim().length < 2}>
            {replyBusy ? "Sending…" : "Send reply"}
          </button>
        </div>
      </main>
    );
  }

  // ---- logged-in: ticket list + new ticket form ----
  return (
    <main className="shell">
      <Nav />
      <div className="results-head">
        <h2>Help & feedback</h2>
        <button className="btn-primary" onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? "Close" : "+ New ticket"}
        </button>
      </div>

      {showNewForm && (
        <div className="step">
          <NewTicketForm
            type={type} setType={setType} subject={subject} setSubject={setSubject}
            email={email} setEmail={setEmail} emailLocked={true}
            message={message} setMessage={setMessage}
            err={err} busy={busy} onSubmit={submitNewTicket}
          />
        </div>
      )}

      {tickets === null ? (
        <div className="loading"><span className="spinner" /> Loading your tickets…</div>
      ) : tickets.length === 0 ? (
        <p className="step-hint" style={{ padding: "20px 0" }}>No tickets yet — tap "New ticket" if you need help with anything.</p>
      ) : (
        <div className="history-list">
          {tickets.map((t) => {
            const last = t.support_ticket_messages[t.support_ticket_messages.length - 1];
            return (
              <button key={t.id} className="history-item" onClick={() => openTicket(t)}>
                <div>
                  <span className="hi-title">{t.subject}</span>
                  <div className="field-note" style={{ marginTop: 2 }}>
                    {last ? `${last.sender === "admin" ? "Support: " : "You: "}${last.message.slice(0, 70)}${last.message.length > 70 ? "…" : ""}` : ""}
                  </div>
                </div>
                <span className={`credits-pill ${t.status !== "open" ? "danger-pill" : ""}`}>{t.status}</span>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}

function NewTicketForm({ type, setType, subject, setSubject, email, setEmail, emailLocked, message, setMessage, err, busy, onSubmit }) {
  return (
    <>
      <label className="field-label">What's this about?</label>
      <div className="level-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {TYPES.map((t) => (
          <button key={t.id} type="button" className={`level-card ${type === t.id ? "on" : ""}`} onClick={() => setType(t.id)}>
            {t.emoji} {t.label}
          </button>
        ))}
      </div>

      <label className="field-label">Subject (optional)</label>
      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="A short summary" />

      <label className="field-label">Your email</label>
      <input type="text" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" disabled={emailLocked} />
      {emailLocked && <p className="field-note">Using your account email.</p>}

      <label className="field-label">Tell us what's going on</label>
      <textarea
        style={{ minHeight: 140 }}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={type === "bug" ? "What happened? What did you expect instead?" : type === "suggestion" ? "What would make TumaCV better for you?" : "What's on your mind?"}
      />

      {err && <p className="error">{err}</p>}
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={onSubmit} disabled={busy}>
        {busy ? "Sending…" : "Send message"}
      </button>
    </>
  );
}
