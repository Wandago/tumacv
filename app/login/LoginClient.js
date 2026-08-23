"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import Turnstile from "../../components/Turnstile";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { FREE_SIGNUP_CREDITS } from "../../lib/plans";

// Environment checks for feature flags.
// GOOGLE_ENABLED is declared further down, next to the Google button it gates
// — declaring it here as well is what broke the build.
const TURNSTILE_ENABLED = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

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
  if (m.includes("provider is not enabled") || m.includes("unsupported provider"))
    return "Google sign-in isn't switched on for this site yet. Use your email and password below, or the sign-in link.";
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

// Google only appears once it's actually configured in Supabase. Same
// pattern as NEXT_PUBLIC_TURNSTILE_SITE_KEY: shipping the button before the
// provider is enabled would give everyone a control that bounces them to an
// error page, so it stays hidden until this is set to "1".
const GOOGLE_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1";

const GoogleMark = () => (
  <svg viewBox="0 0 18 18" width="17" height="17" aria-hidden="true">
    <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
    <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
    <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
    <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
  </svg>
);

export default function LoginClient() {
  const router = useRouter();
  const [mode, setMode] = useState("signin");
  const [rememberMe, setRememberMe] = useState(false);
  const [socialLoading, setSocialLoading] = useState(true);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [appleEnabled, setAppleEnabled] = useState(false);
  const [githubEnabled, setGithubEnabled] = useState(false);

  // Load environment variables and check social provider availability
  useEffect(() => {
    const checkProviders = async () => {
      // Simulate checking provider configuration from environment
      setGoogleEnabled(!!process.env.NEXT_PUBLIC_GOOGLE_AUTH && process.env.NEXT_PUBLIC_GOOGLE_AUTH === "1");
      // For now, we'll keep these as placeholders - they'd be set based on actual configuration
      setAppleEnabled(false);
      setGithubEnabled(false);
      setSocialLoading(false);
    };

    checkProviders();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "signup") setMode("signup");
  }, []);

  // Load remember me preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("tumacv_remember_me");
    if (saved !== null) {
      setRememberMe(saved === "true");
    }
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
  const [oauthBusy, setOauthBusy] = useState(false);
  const turnstileRef = useRef(null);
  const routedRef = useRef(false);

  // Both of these must stay below the state they read: a dependency array is
  // evaluated during render, so listing `email` above its useState left it in
  // the temporal dead zone and threw "Cannot access 'email' before
  // initialization" on every render — the login form mounted with no inputs.
  useEffect(() => {
    if (mode === "signin") {
      const rememberedEmail = localStorage.getItem("tumacv_user_email");
      if (rememberedEmail) setEmail(rememberedEmail);
    }
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("tumacv_remember_me", rememberMe);
    if (rememberMe && email) {
      localStorage.setItem("tumacv_user_email", email);
    } else if (!rememberMe) {
      localStorage.removeItem("tumacv_user_email");
    }
  }, [rememberMe, email]);

  // A profile row is created by a database trigger, so it can lag a brand-new
  // OAuth signup by a moment. Treat "no row yet" as not onboarded: that sends
  // them through onboarding (where the pending referral code is applied)
  // rather than dropping them on a dashboard with nothing behind it.
  async function routeAfterAuth(userId) {
    if (routedRef.current) return;
    routedRef.current = true;
    const { data: profile } = await supabaseBrowser()
      .from("profiles").select("onboarded").eq("id", userId).single();
    router.push(profile?.onboarded ? "/dashboard" : "/onboarding");
  }

  // Google and the magic link both come back to this page with the session in
  // the URL fragment. The Supabase client consumes it on its own; all that's
  // left is deciding where the person lands.
  useEffect(() => {
    const hash = window.location.hash || "";
    if (!hash.includes("access_token") && !hash.includes("error_description")) return;

    if (hash.includes("error_description")) {
      const p = new URLSearchParams(hash.slice(1));
      setErr(friendly(p.get("error_description") || "Sign-in failed. Try again."));
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    setOauthBusy(true);
    const sb = supabaseBrowser();
    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (session?.user) routeAfterAuth(session.user.id);
    });
    // The session may already have been restored before the listener attached.
    sb.auth.getSession().then(({ data }) => {
      if (data?.session?.user) routeAfterAuth(data.session.user.id);
    });
    return () => sub.subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function switchMode(m) {
    setMode(m);
    setErr("");
    setMsg("");
    setPendingConfirm(false);
  }

  async function signInWithGoogle() {
    setErr("");
    setOauthBusy(true);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/login` },
    });
    // On success the browser navigates away, so only a failure lands here.
    if (error) {
      setOauthBusy(false);
      setErr(friendly(error.message));
    }
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

    if (mode === "magic") {
      if (!email) { setErr("Enter your email first."); return; }
      setBusy(true);
      // shouldCreateUser lets the same link serve as a signup, so someone who
      // has never registered isn't sent back to fill in a password form.
      const { error } = await sb.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          shouldCreateUser: true,
          ...captchaOptions,
        },
      });
      setBusy(false);
      turnstileRef.current?.reset();
      if (error) setErr(friendly(error.message));
      else setMsg(`Link sent to ${email}. Open it on this device — check spam if it's not there in a minute.`);
      return;
    }

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
      await routeAfterAuth(data.user.id);
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
    mode === "forgot" || mode === "magic"
      ? !!email
      : mode === "signup"
      ? email && password.length >= 6 && confirm.length >= 6 && agreed
      : email && password.length >= 6;

  const usesPassword = mode === "signin" || mode === "signup";

  return (
    <main className="shell">
      <Nav />
      <section className="hero hero-band">
        {mode === "signup" && <p className="step-indicator">Step 1 of 2</p>}
        <h1>
          {mode === "signin" && "Welcome back"}
          {mode === "signup" && "Create your account"}
          {mode === "forgot" && "Reset your password"}
          {mode === "magic" && "Sign in without a password"}
        </h1>
        <p className="step-hint">
          {mode === "signin" && "Your applications, credits and history are where you left them."}
          {mode === "signup" &&
            `${FREE_SIGNUP_CREDITS} free applications to start — no card, no subscription.`}
          {mode === "forgot" && "Enter your email and we'll send you a link to set a new password."}
          {mode === "magic" && "We'll email you a link that signs you straight in. No password needed, new account or old."}
        </p>
      </section>

      <div className="auth-card">
        {mode !== "forgot" && (
          <>
            <div className="social-login">
              <h3>Sign in with</h3>
              <div className="social-buttons">
                {!socialLoading && (
                  <>
                    {googleEnabled && (
                      <button
                        type="button"
                        className="btn-oauth"
                        onClick={signInWithGoogle}
                        disabled={busy || oauthBusy}
                      >
                        <GoogleMark />
                        {oauthBusy ? "Opening Google…" : "Continue with Google"}
                      </button>
                    )}
                    {!googleEnabled && !appleEnabled && !githubEnabled && (
                      <button
                        type="button"
                        className="btn-oauth"
                        disabled
                        style={{ opacity: 0.5 }}
                      >
                        Social login (not configured)
                      </button>
                    )}
                  </>
                )}
                {socialLoading && (
                  <button
                    type="button"
                    className="btn-oauth"
                    disabled
                    style={{ opacity: 0.7 }}
                  >
                    Loading social options…
                  </button>
                )}
              </div>
            </div>

            {mode !== "magic" && (
              <button
                type="button"
                className="btn-oauth"
                onClick={() => switchMode("magic")}
                disabled={busy || oauthBusy}
              >
                Email me a sign-in link
              </button>
            )}
            <p className="oauth-terms">
              By continuing you agree to our{" "}
              <a href="/privacy" target="_blank">Privacy Policy</a> and{" "}
              <a href="/terms" target="_blank">Terms of Use</a>.
            </p>
            {usesPassword && (
              <div className="auth-divider"><span>or use a password</span></div>
            )}
          </>
        )}

        <label className="field-label" htmlFor="email">Email</label>
        <input id="email" type="text" inputMode="email" autoComplete="email" value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />

        {usesPassword && (
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

        {mode === "signin" && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 16, fontSize: 12.5, color: "var(--soil)", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{ width: "auto", marginTop: 2, accentColor: "var(--kijani)" }}
            />
            <span>
              Remember me on this device
            </span>
          </label>
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
            : mode === "magic"
            ? "Send me the link"
            : "Send reset link"}
        </button>

        <p className="switch-mode">
          {mode === "signin" && (
            <>New here? <button className="linkish" onClick={() => switchMode("signup")}>Create an account</button></>
          )}
          {mode === "signup" && (
            <>Already have an account? <button className="linkish" onClick={() => switchMode("signin")}>Sign in</button></>
          )}
          {(mode === "forgot" || mode === "magic") && (
            <><button className="linkish" onClick={() => switchMode("signin")}>← Back to sign in</button></>
          )}
        </p>
      </div>
    </main>
  );
}
