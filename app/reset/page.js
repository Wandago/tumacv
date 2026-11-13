"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Center } from "@astryxdesign/core/Center";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Banner } from "@astryxdesign/core/Banner";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { BrandMark } from "../../lib/icons";
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
    <Center paddingBlock={8} paddingInline={4}>
      <VStack gap={5} width="100%" maxWidth={440}>
        <VStack gap={2} hAlign="center">
          <BrandMark size={40} />
          <Heading level={1} justify="center">Set a new password</Heading>
        </VStack>
        <Card padding={6} elevation="low">
          {!ready ? (
            <VStack gap={4}>
              <Text color="secondary">
                This link has expired or wasn't opened from your email. That's fine — request a fresh reset link,
                sign in if you remember your password, or create an account if you don't have one yet.
              </Text>
              <HStack gap={2} wrap="wrap">
                <Button label="Sign in" variant="primary" onClick={() => router.push("/login")} />
                <Button label="Send a new reset link" onClick={() => router.push("/login")} />
                <Button label="Create an account" variant="ghost" onClick={() => router.push("/login?mode=signup")} />
              </HStack>
            </VStack>
          ) : (
            <VStack
              as="form"
              gap={4}
              onSubmit={(e) => {
                e.preventDefault();
                if (!busy && password && confirm) save();
              }}
            >
              <Text color="secondary">Choose a new password for your account.</Text>
              <TextInput type={show ? "text" : "password"} label="New password" placeholder="At least 6 characters" value={password} onChange={setPassword} hasAutoFocus />
              <TextInput
                type={show ? "text" : "password"}
                label="Confirm new password"
                placeholder="Type it again"
                value={confirm}
                onChange={setConfirm}
                status={confirm.length > 0 && password !== confirm ? { type: "error", message: "Passwords don't match yet." } : undefined}
              />
              <CheckboxInput label="Show passwords" size="sm" value={show} onChange={setShow} />
              {err && <Banner status="error" title={err} />}
              <Button type="submit" label="Save new password" variant="primary" size="lg" width="100%" isLoading={busy} isDisabled={!password || !confirm} />
            </VStack>
          )}
        </Card>
      </VStack>
    </Center>
  );
}
