"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import Turnstile from "../../components/Turnstile";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { FREE_SIGNUP_CREDITS } from "../../lib/plans";

function friendly(message) {
  const m = (message || "").toLowerCase();
  if (m.includes("email not confirmed"))
    return "Almost there — you still need to click the confirmation link we emailed you. Check spam if it's not in your inbox.";
  if (m.includes("invalid login credentials"))
    return "Email or password doesn't match. If you're new here, tap \"Create an account\" below — or use \"Forgot password?\" to reset it.";
  if (m.includes("already registered"))
    return "That email already has an account. Use \"Sign in\" instead, or reset your password if you've forgotten it.";
  if (m.includes("rate limit"))
    return "Too many attempts for now. Wait a few minutes and try again.";
  if (m.includes("password should be"))
    return "Password needs to be at least 6 characters.";
  if (m.includes("captcha"))
    return "The security check didn't load — this can happen with browser privacy tools like Brave Shields or an ad blocker. Try disabling them for this site, or use a different browser, then try again.";
  return message || "Something went wrong. Try again.";
}

function strength(pw) {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Okay", "Good", "Strong", "Strong"];
  return { score, label: labels[score] };
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

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
  }, []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const turnstileRef = useRef(null);

  function switchMode(m) {
    setMode(m);
    setErr("");
    setMsg("");
    setPendingConfirm(false);
  }

  async function resendConfirmation() {
    if (!email) return;
    setResendBusy(true);
    setResendMsg("");
    const { error } = await supabaseBrowser().auth.resend({ type: "signup", email });
    setResendBusy(false);
    setResendMsg(error ? friendly(error.message) : "Sent — check your inbox (and spam folder).");
  }

  async function submit() {
    setErr("");
    setMsg("");
    const sb = supabaseBrowser();
    const captchaOptions = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? { captchaToken } : {};

    if (mode === "forgot") {
      if (!email) { setErr("Enter your email first."); return; }
      setBusy(true);
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset`,
        ...captchaOptions,
      });
      setBusy(false);
      turnstileRef.current?.reset();
      if (error) setErr(friendly(error.message));
      else setMsg("Reset link sent — check your email (and spam folder). The link takes you back here to set a new password.");
      return;
    }

    if (mode === "signup") {
      if (password.length < 6) { setErr("Password needs to be at least 6 characters."); return; }
      if (password !== confirm) { setErr("Passwords don't match — check both boxes."); return; }
      if (!agreed) { setErr("Please accept the Privacy Policy and Terms of Use to continue."); return; }
      setBusy(true);
      try {
        const { data, error } = await sb.auth.signUp({ email, password, options: captchaOptions });
        if (error) throw error;
        if (data.session) router.push("/onboarding");
        else {
          setMsg("Account created. Check your email for a confirmation link, then sign in.");
          setPendingConfirm(true);
        }
      } catch (e) {
        setErr(friendly(e.message));
      } finally {
        setBusy(false);
        turnstileRef.current?.reset();
      }
      return;
    }

    setBusy(true);
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password, options: captchaOptions });
      if (error) throw error;
      const { data: profile } = await sb
        .from("profiles")
        .select("onboarded")
        .eq("id", data.user.id)
        .single();
      router.push(profile && !profile.onboarded ? "/onboarding" : "/dashboard");
    } catch (e) {
      setErr(friendly(e.message));
      if ((e.message || "").toLowerCase().includes("email not confirmed")) setPendingConfirm(true);
    } finally {
      setBusy(false);
      turnstileRef.current?.reset();
    }
  }

  // Don't hard-block on captchaToken client-side: privacy-focused browsers
  // (Brave Shields, some ad blockers) commonly block Turnstile's script
  // entirely, which would otherwise leave the button silently disabled
  // forever with no visible error. Supabase verifies the token server-side
  // and is the real source of truth — if it's genuinely required and
  // missing, that error surfaces normally through the catch block below.
  const canSubmit =
    mode === "forgot"
      ? !!email
      : mode === "signup"
      ? email && password.length >= 6 && confirm.length >= 6 && agreed
      : email && password.length >= 6;

  return (
    <main className="shell">
      <Nav />
      <section className="hero hero-band">
        {mode === "signup" && <p className="step-indicator">Step 1 of 2</p>}
        <h1>
          {mode === "signin" && "Welcome back"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
        </h1>
        <p className="step-hint">
          {mode === "signin" && "Your applications, credits and history are where you left them."}
          {mode === "signup" &&
            `${FREE_SIGNUP_CREDITS} free applications to start — no card, no subscription.`}
          {mode === "forgot" && "Enter your email and we'll send you a link to set a new password."}
        </p>
      </section>

      <div className="auth-card">
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

        {mode === "signup" && password.length > 0 && (
          <div className="strength-row">
            <div className="strength-bars">
              {[0, 1, 2, 3, 4].map((i) => (
                <span key={i} className={`strength-bar ${i < strength(password).score ? "on s" + strength(password).score : ""}`} />
              ))}
            </div>
            <span className="strength-label">{strength(password).label}</span>
          </div>
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

        {mode === "signup" && (
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, marginTop: 16, fontSize: 12.5, color: "var(--soil)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ width: "auto", marginTop: 2, accentColor: "var(--kijani)" }}
            />
            <span>
              I agree to the <a href="/privacy" target="_blank" className="linkish" style={{ fontSize: 12.5 }}>Privacy Policy</a> and{" "}
              <a href="/terms" target="_blank" className="linkish" style={{ fontSize: 12.5 }}>Terms of Use</a>.
            </span>
          </label>
        )}

        {err && <p className="error">{err}</p>}
        {msg && <p className="success">{msg}</p>}
        {pendingConfirm && (
          <p className="field-note" style={{ marginTop: 4 }}>
            Didn't get it?{" "}
            <button className="linkish" onClick={resendConfirmation} disabled={resendBusy}>
              {resendBusy ? "Sending…" : "Resend confirmation email"}
            </button>
            {resendMsg && <span> — {resendMsg}</span>}
          </p>
        )}

        <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />

        <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={submit}
          disabled={busy || !canSubmit}>
          {busy
            ? "One moment…"
            : mode === "signin"
            ? "Sign in"
            : mode === "signup"
            ? `Create account — ${FREE_SIGNUP_CREDITS} free applications`
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
