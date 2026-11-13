"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Center } from "@astryxdesign/core/Center";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Banner } from "@astryxdesign/core/Banner";
import { Divider } from "@astryxdesign/core/Divider";
import { Link } from "@astryxdesign/core/Link";
import { ProgressBar } from "@astryxdesign/core/ProgressBar";
import { Token } from "@astryxdesign/core/Token";
import { Icon } from "@astryxdesign/core/Icon";
import Turnstile from "../../components/Turnstile";
import { BrandMark, MailIcon } from "../../lib/icons";
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

  const strengthInfo = strength(password);
  const strengthVariant = strengthInfo.score <= 1 ? "error" : strengthInfo.score === 2 ? "warning" : "success";

  const title = {
    signin: "Welcome back",
    signup: "Create your account",
    forgot: "Reset your password",
    magic: "Sign in without a password",
  }[mode];
  const subtitle = {
    signin: "Your applications, credits and history are where you left them.",
    signup: `${FREE_SIGNUP_CREDITS} free applications to start — no card, no subscription.`,
    forgot: "Enter your email and we'll send you a link to set a new password.",
    magic: "We'll email you a link that signs you straight in. No password needed, new account or old.",
  }[mode];
  const submitLabel = {
    signin: "Sign in",
    signup: `Create account — ${FREE_SIGNUP_CREDITS} free applications`,
    magic: "Send me the link",
    forgot: "Send reset link",
  }[mode];

  return (
    <Center paddingBlock={8} paddingInline={4}>
      <VStack gap={5} width="100%" maxWidth={440}>
        <VStack gap={2} hAlign="center">
          <BrandMark size={40} />
          {mode === "signup" && <Token label="Step 1 of 2" size="sm" color="green" />}
          <Heading level={1} justify="center">{title}</Heading>
          <Text color="secondary" justify="center" textWrap="balance">{subtitle}</Text>
        </VStack>

        <Card padding={6} elevation="low">
          <VStack
            as="form"
            gap={4}
            onSubmit={(e) => {
              e.preventDefault();
              if (canSubmit && !busy) submit();
            }}
          >
            {mode !== "forgot" && (
              <>
                {GOOGLE_ENABLED && (
                  <Button
                    label={oauthBusy ? "Opening Google…" : "Continue with Google"}
                    icon={<GoogleMark />}
                    width="100%"
                    size="lg"
                    isDisabled={busy || oauthBusy}
                    onClick={signInWithGoogle}
                  />
                )}
                {mode !== "magic" && (
                  <Button
                    label="Email me a sign-in link"
                    icon={<Icon icon={MailIcon} />}
                    width="100%"
                    size="lg"
                    isDisabled={busy || oauthBusy}
                    onClick={() => switchMode("magic")}
                  />
                )}
                {usesPassword && <Divider label="or use a password" />}
              </>
            )}

            <TextInput type="email" label="Email" placeholder="you@example.com" value={email} onChange={setEmail} hasAutoFocus />

            {usesPassword && (
              <TextInput
                type="password"
                label="Password"
                placeholder="At least 6 characters"
                value={password}
                onChange={setPassword}
              />
            )}

            {mode === "signup" && password.length > 0 && (
              <ProgressBar
                label={`Password strength: ${strengthInfo.label}`}
                hasValueLabel={false}
                value={strengthInfo.score}
                max={5}
                variant={strengthVariant}
              />
            )}

            {mode === "signup" && (
              <TextInput
                type="password"
                label="Confirm password"
                placeholder="Type it again"
                value={confirm}
                onChange={setConfirm}
                status={confirm.length > 0 && password !== confirm ? { type: "error", message: "Passwords don't match yet." } : undefined}
              />
            )}

            {mode === "signin" && (
              <HStack justify="between" align="center" wrap="wrap" gap={2}>
                <CheckboxInput label="Remember me" size="sm" value={rememberMe} onChange={setRememberMe} />
                <Button label="Forgot password?" variant="ghost" size="sm" onClick={() => switchMode("forgot")} />
              </HStack>
            )}

            {mode === "signup" && (
              <CheckboxInput
                label="I agree to the Privacy Policy and Terms of Use (linked below)"
                value={agreed}
                onChange={setAgreed}
              />
            )}

            {err && <Banner status="error" title={err} />}
            {msg && <Banner status="success" title={msg} />}
            {pendingConfirm && (
              <HStack gap={2} align="center" wrap="wrap">
                <Text type="supporting" color="secondary">Didn't get the email?</Text>
                <Button
                  label="Resend confirmation"
                  size="sm"
                  variant="ghost"
                  isLoading={resendBusy}
                  onClick={resendConfirmation}
                />
                {resendMsg && <Text type="supporting" color="secondary">{resendMsg}</Text>}
              </HStack>
            )}

            <Turnstile ref={turnstileRef} onToken={setCaptchaToken} />

            <Button type="submit" label={busy ? "One moment…" : submitLabel} variant="primary" size="lg" width="100%" isLoading={busy} isDisabled={!canSubmit} />

            {mode !== "forgot" && (
              <Text color="secondary" justify="center">
                By continuing you agree to our <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Use</Link>.
              </Text>
            )}
          </VStack>
        </Card>

        <HStack justify="center" gap={1} align="center">
          {mode === "signin" && (
            <>
              <Text color="secondary">New here?</Text>
              <Button label="Create an account" variant="ghost" size="sm" onClick={() => switchMode("signup")} />
            </>
          )}
          {mode === "signup" && (
            <>
              <Text color="secondary">Already have an account?</Text>
              <Button label="Sign in" variant="ghost" size="sm" onClick={() => switchMode("signin")} />
            </>
          )}
          {(mode === "forgot" || mode === "magic") && (
            <Button label="← Back to sign in" variant="ghost" size="sm" onClick={() => switchMode("signin")} />
          )}
        </HStack>
      </VStack>
    </Center>
  );
}
