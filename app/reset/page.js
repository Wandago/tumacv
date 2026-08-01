"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Nav from "../../components/Nav";
import { supabaseBrowser } from "../../lib/supabaseClient";

export default function ResetPassword() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The emailed link signs the user into a temporary recovery session.
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => setReady(!!data?.session));
    const { data: sub } = sb.auth.onAuthStateChange((_e, session) => setReady(!!session));
    return () => sub?.subscription?.unsubscribe();
  }, []);

  async function save() {
    setErr("");
    if (password.length < 6) { setErr("Password needs to be at least 6 characters."); return; }
    if (password !== confirm) { setErr("Passwords don't match — check both boxes."); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password });
    setBusy(false);
    if (error) setErr(error.message);
    else router.push("/dashboard");
  }

  return (
    <main className="shell">
      <Nav />
      <div className="auth-card">
        <h1>Set a new password</h1>
        {!ready ? (
          <>
            <p className="step-hint">
              This link has expired or wasn't opened from your email. That's fine — you can request
              a fresh reset link, sign in if you remember your password, or create a new account if
              you don't have one yet.
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
              <a className="btn-ghost" style={{ textDecoration: "none" }} href="/login">Sign in</a>
              <a className="btn-ghost" style={{ textDecoration: "none" }} href="/login">Create an account</a>
            </div>
          </>
        ) : (
          <>
            <p className="step-hint">Choose a new password for your account.</p>
            <label className="field-label" htmlFor="pw">New password</label>
            <div style={{ position: "relative" }}>
              <input id="pw" type={show ? "text" : "password"} autoComplete="new-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters" style={{ paddingRight: 64 }} />
              <button type="button" className="linkish"
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", fontSize: 12 }}
                onClick={() => setShow(!show)}>
                {show ? "Hide" : "Show"}
              </button>
            </div>
            <label className="field-label" htmlFor="cpw">Confirm new password</label>
            <input id="cpw" type={show ? "text" : "password"} autoComplete="new-password"
              value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again"
              onKeyDown={(e) => e.key === "Enter" && save()} />
            {confirm.length > 0 && password !== confirm && (
              <p className="error" style={{ marginTop: 6 }}>Passwords don't match yet.</p>
            )}
            {err && <p className="error">{err}</p>}
            <button className="btn-primary" style={{ width: "100%", marginTop: 14 }} onClick={save}
              disabled={busy || !password || !confirm}>
              {busy ? "Saving…" : "Save new password"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}
