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
  const [user, setUser] = useState(null);
  const [type, setType] = useState("bug");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      setUser(data?.user || null);
      if (data?.user?.email) setEmail(data.user.email);
    });
  }, []);

  async function submit() {
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
        body: JSON.stringify({ type, message, email }),
      });
      const data = await res.json();
      if (!res.ok) setErr(data.error || "Could not send your message. Try again.");
      else {
        setSent(true);
        setMessage("");
      }
    } catch {
      setErr("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <Nav />
      <section className="hero" style={{ paddingBottom: 6 }}>
        <h1>Help & feedback</h1>
        <p>Hit a bug, have an idea, or just want to tell us something? We read every message.</p>
      </section>

      <div className="step">
        {sent ? (
          <>
            <h2 style={{ marginBottom: 8 }}>Got it — thank you.</h2>
            <p className="step-hint" style={{ marginBottom: 14 }}>
              We'll follow up at {email} if we need more detail or once it's sorted.
            </p>
            <button className="btn-ghost" onClick={() => setSent(false)}>Send another message</button>
          </>
        ) : (
          <>
            <label className="field-label">What's this about?</label>
            <div className="level-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`level-card ${type === t.id ? "on" : ""}`}
                  onClick={() => setType(t.id)}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            <label className="field-label">Your email</label>
            <input
              type="text"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={!!user}
            />
            {user && <p className="field-note">Using your account email. Signed in as {user.email}.</p>}

            <label className="field-label">Tell us what's going on</label>
            <textarea
              style={{ minHeight: 160 }}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "bug"
                  ? "What happened? What were you trying to do, and what did you expect instead?"
                  : type === "suggestion"
                  ? "What would make TumaCV better for you?"
                  : "What's on your mind?"
              }
            />

            {err && <p className="error">{err}</p>}
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={submit} disabled={busy}>
              {busy ? "Sending…" : "Send message"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
