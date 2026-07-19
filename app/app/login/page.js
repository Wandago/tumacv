"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

function friendly(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("invalid login credentials"))
    return "Email or password doesn't match. If you're new here, tap \"Create an account\" below — or use \"Forgot password?\" to reset it.";
  if (m.includes("already registered"))
    return "That email already has an account. Use \"Sign in\" instead, or reset your password if you've forgotten it.";
  if (m.includes("rate limit"))
    return "Too many attempts for now. Wait a few minutes and try again.";
  if (m.includes("password should be"))
    return "Password needs to be at least 6 characters.";
  return message || "Something went wrong. Try again.";
}

function PasswordInput({ id, value, onChange, placeholder, autoComplete, onEnter }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <input
        id={id}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{ paddingRight: 64 }}
        onKeyDown={(e) => e.key === "Enter" && onEnter && onEnter()}
      />
      <button
        type="button"
        className="linkish"
        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}
        onClick={() => setShow(!show)}
      >
        {show ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function Login() {
  const router = useRouter();
  const [mode, setMode] = useState("signin"); // signin | signup | forgot
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  function switchMode(m) {
    setMode(m);
    setErr("");
    setMsg("");
  }

  async function submit() {
    setErr("");
    setMsg("");
    const sb = supabaseBrowser();

    if (mode === "forgot") {
      if (!email) { setErr("Enter your email first."); return; }
      setBusy(true);
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
      });
      setBusy(false);
      if (error) setErr(friendly(error.message));
      else setMsg("Reset link sent — check your email (and spam folder). The link takes you back here to set a new password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) { setErr("Password needs to be at least 6 characters."); return; }
      if (password !== confirm) { setErr("Passwords don't match — check both boxes."); return; }
      setBusy(true);
      try {
        const { data, error } = await sb.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) router.push("/dashboard");
        else setMsg("Account created. Check your email for a confirmation link, then sign in.");
      } catch (e) {
        setErr(friendly(e.message));
      } finally {
        setBusy(false);
      }
      return;
    }

    // signin
    setBusy(true);
    try {
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error;
      router.push("/dashboard");
    } catch (e) {
      setErr(friendly(e.message));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit =
    mode === "forgot"
      ? !!email
      : mode === "signup"
      ? email && password.length >= 6 && confirm.length >= 6
      : email && password.length >= 6;

  return (
    <main className="shell">
      <Nav />
      <div className="auth-card">
        <h1>
          {mode === "signin" && "Welcome back"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
        </h1>
        <p className="step-hint">
          {mode === "signin" && "Sign in to your applications, credits and history."}
          {mode === "signup" && "New accounts start with 2 free applications."}
          {mode === "forgot" && "We'll email you a link to set a new password."}
        </p>

        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" type="text" inputMode="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

        {mode !== "forgot" && (
          <>
            <label className="field-label" htmlFor="password">Password</label>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              onEnter={mode === "signin" ? submit : undefined}
            />
          </>
        )}

        {mode === "signup" && (
          <>
            <label className="field-label" htmlFor="confirm">Confirm password</label>
            <PasswordInput
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Type it again"
              autoComplete="new-password"
              onEnter={submit}
            />
            {confirm.length > 0 && password !== confirm && (
              <p className="error" style={{ marginTop: 6 }}>Passwords don't match yet.</p>
            )}
          </>
        )}

        {mode === "signin" && (
          <p style={{ textAlign: "right", marginTop: 8 }}>
            <button className="linkish" onClick={() => switchMode("forgot")}>Forgot password?</button>
          </p>
        )}

        {err && <p className="error">{err}</p>}
        {msg && <p className="success">{msg}</p>}

        <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={submit}
          disabled={busy || !canSubmit}>
          {busy
            ? "One moment…"
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? "Create account — 2 free applications"
            : "Send reset link"}
        </button>

        <p className="switch-mode">
          {mode === "signin" && (
            <>New here? <button className="linkish" onClick={() => switchMode("signup")}>Create an account</button></>
          )}
          {mode === "signup" && (
            <>Already have an account? <button className="linkish" onClick={() => switchMode("signin")}>Sign in</button></>
          )}
          {mode === "forgot" && (
            <><button className="linkish" onClick={() => switchMode("signin")}>← Back to sign in</button></>
          )}
        </p>
      </div>
    </main>
  );
}