"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr("");
    setMsg("");
    setBusy(true);
    const sb = supabaseBrowser();
    try {
      if (mode === "signup") {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          router.push("/dashboard");
        } else {
          setMsg("Check your email for a confirmation link, then sign in.");
        }
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push("/dashboard");
      }
    } catch (e) {
      setErr(e.message || "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="shell">
      <Nav />
      <div className="auth-card">
        <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
        <p className="step-hint">
          {mode === "signin"
            ? "Sign in to your applications, credits and history."
            : "New accounts start with 2 free applications."}
        </p>
        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" type="text" inputMode="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
        <label className="field-label" htmlFor="password">Password</label>
        <input id="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"}
          value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
          onKeyDown={(e) => e.key === "Enter" && submit()} />
        {err && <p className="error">{err}</p>}
        {msg && <p className="success">{msg}</p>}
        <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={submit}
          disabled={busy || !email || password.length < 6}>
          {busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account — 2 free applications"}
        </button>
        <p className="switch-mode">
          {mode === "signin" ? (
            <>New here? <button className="linkish" onClick={() => setMode("signup")}>Create an account</button></>
          ) : (
            <>Already have an account? <button className="linkish" onClick={() => setMode("signin")}>Sign in</button></>
          )}
        </p>
      </div>
    </main>
  );
}
