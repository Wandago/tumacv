"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Layout, LayoutContent } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Card } from "@astryxdesign/core/Card";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { Selector } from "@astryxdesign/core/Selector";
import { SelectableCard } from "@astryxdesign/core/SelectableCard";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { FileInput } from "@astryxdesign/core/FileInput";
import { CheckboxInput } from "@astryxdesign/core/CheckboxInput";
import { Banner } from "@astryxdesign/core/Banner";
import { Token } from "@astryxdesign/core/Token";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { Divider } from "@astryxdesign/core/Divider";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { extractPdfText } from "../../lib/pdfText";
import { extractImagesToText } from "../../lib/imageExtract";
import { INDUSTRIES, EXPERIENCE_LEVELS as LEVELS } from "../../lib/gamification";
import { getSavedProfile, setSavedProfile } from "../../lib/storage";
import { getStoredReferralCode, clearStoredReferralCode } from "../../lib/referral";
import { normalizeKenyanPhone } from "../../lib/daraja";
import LinkedInGuide from "../../components/LinkedInGuide";
import { looksLikeBareLinkedInUrl } from "../../lib/linkedin";

const REFERRAL_SOURCES = [
  { id: "whatsapp", label: "WhatsApp", emoji: "💬" },
  { id: "friend", label: "Friend / referral", emoji: "🤝" },
  { id: "facebook", label: "Facebook", emoji: "📘" },
  { id: "instagram", label: "Instagram", emoji: "📸" },
  { id: "tiktok", label: "TikTok", emoji: "🎵" },
  { id: "x", label: "X / Twitter", emoji: "𝕏" },
  { id: "google", label: "Google search", emoji: "🔍" },
  { id: "jobsboard", label: "Another jobs site", emoji: "💼" },
  { id: "other", label: "Other", emoji: "✨" },
];

export default function Onboarding() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [industry, setIndustry] = useState("");
  const [level, setLevel] = useState("");
  const [referral, setReferral] = useState("");
  const [phone, setPhone] = useState("");
  const [sendUpdates, setSendUpdates] = useState(true);
  const [profileText, setProfileText] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getUser().then(async ({ data }) => {
      if (!data?.user) { router.replace("/login"); return; }
      const { data: profile } = await sb
        .from("profiles")
        .select("industry, experience_level, profile_text, onboarded, referral_source, phone, marketing_opt_out")
        .eq("id", data.user.id)
        .single();

      setIsEditing(!!profile?.onboarded);
      if (profile?.industry) setIndustry(profile.industry);
      if (profile?.experience_level) setLevel(profile.experience_level);
      if (profile?.referral_source) setReferral(profile.referral_source);
      if (profile?.phone) setPhone(profile.phone);
      setSendUpdates(!profile?.marketing_opt_out);
      if (profile?.profile_text) {
        setProfileText(profile.profile_text);
      } else {
        // Scoped to this account's id — never a different person's leftover draft.
        const draft = getSavedProfile(data.user.id);
        if (draft) setProfileText(draft);
      }
      setReady(true);
    });
  }, [router]);

  async function handlePdf(file) {
    setPdfErr("");
    if (file.type !== "application/pdf") {
      setPdfErr("Please upload a PDF file.");
      return;
    }
    setPdfBusy(true);
    try {
      const text = await extractPdfText(file);
      if (text.length < 80) setPdfErr("Couldn't read much text from that PDF — try the photo option, or paste instead.");
      else setProfileText(text);
    } catch {
      setPdfErr("Couldn't read that PDF. Try re-saving it, or paste your details instead.");
    } finally {
      setPdfBusy(false);
    }
  }

  async function handlePhotos(files) {
    setPhotoErr("");
    if (files.length > 4) {
      setPhotoErr("Please choose up to 4 photos at a time.");
      return;
    }
    setPhotoBusy(true);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const text = await extractImagesToText(files, sess?.session?.access_token);
      setProfileText(text);
    } catch (err) {
      setPhotoErr(err.message || "Couldn't read those photos. Try again, or type your details instead.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function applyReferralIfPending() {
    const code = getStoredReferralCode();
    if (!code) return;
    try {
      const sb = supabaseBrowser();
      const { data: sess } = await sb.auth.getSession();
      const res = await fetch("/api/account/apply-referral", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
        body: JSON.stringify({ code }),
      });
      // Anything but a server hiccup is a terminal outcome (applied,
      // self-referral, already used, bad code) — stop retrying either way.
      if (res.status !== 500) clearStoredReferralCode();
    } catch {}
  }

  async function save() {
    setErr("");
    setBusy(true);
    setSaved(false);
    if (phone.trim() && !normalizeKenyanPhone(phone)) {
      setErr("That doesn't look like a valid Kenyan phone number.");
      setBusy(false);
      return;
    }
    try {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      const { error } = await sb
        .from("profiles")
        .update({
          industry: industry || null,
          experience_level: level || null,
          profile_text: profileText || null,
          onboarded: true,
          phone: phone.trim() ? normalizeKenyanPhone(phone) : null,
          marketing_opt_out: !sendUpdates,
          ...(isEditing ? {} : { referral_source: referral || null }),
        })
        .eq("id", userData.user.id);
      if (error) throw error;
      if (profileText) setSavedProfile(userData.user.id, profileText);
      if (isEditing) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } else {
        await applyReferralIfPending();
        router.push("/dashboard");
      }
    } catch (e) {
      setErr("Could not save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function skipOrCancel() {
    if (isEditing) {
      router.push("/dashboard");
      return;
    }
    setBusy(true);
    try {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      await sb.from("profiles").update({ onboarded: true }).eq("id", userData.user.id);
      await applyReferralIfPending();
      router.push("/dashboard");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <Center minHeight="60vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  return (
    <Layout
      height="auto"
      contentWidth={720}
      content={
        <LayoutContent padding={6} isScrollable={false}>
          <VStack gap={6}>
            <VStack gap={2}>
              {!isEditing && (
                <HStack>
                  <Token label="Step 2 of 2" size="sm" color="pink" />
                </HStack>
              )}
              <Heading level={1}>{isEditing ? "Your profile" : "A little about you"}</Heading>
              <Text color="secondary">
                {isEditing
                  ? "Update this any time — new job, new skills, new CV. Every application you generate uses what's saved here."
                  : "Optional, and about a minute. It's what lets your first CV already sound like your field instead of generic."}
              </Text>
            </VStack>

            <Card padding={6}>
              <VStack gap={5}>
                <Selector
                  label="Industry"
                  placeholder="Select…"
                  hasSearch
                  value={industry}
                  onChange={setIndustry}
                  options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
                />

                <VStack gap={2}>
                  <Text weight="medium">Experience level</Text>
                  <Grid columns={{ minWidth: 200 }} gap={2}>
                    {LEVELS.map((l) => (
                      <SelectableCard key={l.id} label={l.label} isSelected={level === l.id} onChange={() => setLevel(l.id)} padding={3}>
                        <Text>{l.label}</Text>
                      </SelectableCard>
                    ))}
                  </Grid>
                </VStack>

                {!isEditing && (
                  <VStack gap={2}>
                    <Text weight="medium">How did you hear about TumaCV?</Text>
                    <Grid columns={{ minWidth: 150 }} gap={2}>
                      {REFERRAL_SOURCES.map((r) => (
                        <SelectableCard key={r.id} label={r.label} isSelected={referral === r.id} onChange={() => setReferral(r.id)} padding={3}>
                          <Text>{r.emoji} {r.label}</Text>
                        </SelectableCard>
                      ))}
                    </Grid>
                  </VStack>
                )}

                <Divider />

                <TextInput
                  label="Phone number"
                  isOptional
                  description="Only used if you opt in to WhatsApp/SMS tips below — never shared."
                  placeholder="07XX XXX XXX"
                  value={phone}
                  onChange={setPhone}
                  width={260}
                />
                <CheckboxInput
                  label={`Send me occasional tips, credit reminders and new features by email${phone.trim() ? ", WhatsApp or SMS" : ""}`}
                  description="You can turn this off here any time."
                  value={sendUpdates}
                  onChange={setSendUpdates}
                />

                <Divider />

                <VStack gap={3}>
                  <VStack gap={1}>
                    <Text weight="medium">Your CV or LinkedIn profile</Text>
                    <Text type="supporting" color="secondary">
                      Upload a PDF or photos and we'll read them, or paste the text. On iPhone the photo option is
                      usually easiest.
                    </Text>
                  </VStack>
                  <Grid columns={{ minWidth: 240 }} gap={3}>
                    <FileInput
                      label="PDF"
                      accept="application/pdf"
                      value={null}
                      onChange={(f) => f && handlePdf(Array.isArray(f) ? f[0] : f)}
                      isLoading={pdfBusy}
                      placeholder="Choose a PDF"
                      status={pdfErr ? { type: "error", message: pdfErr } : undefined}
                    />
                    <FileInput
                      label="Photos (up to 4)"
                      accept="image/*"
                      isMultiple
                      maxFiles={4}
                      value={null}
                      onChange={(f) => f && handlePhotos(Array.isArray(f) ? f : [f])}
                      isLoading={photoBusy}
                      placeholder="Choose photos"
                      status={photoErr ? { type: "error", message: photoErr } : undefined}
                    />
                  </Grid>
                  <LinkedInGuide />
                  <TextArea
                    label="CV text"
                    isLabelHidden
                    rows={8}
                    placeholder="Paste your CV or LinkedIn export text here…"
                    value={profileText}
                    onChange={setProfileText}
                    status={
                      looksLikeBareLinkedInUrl(profileText)
                        ? { type: "error", message: "That's a LinkedIn link, not your profile content — save it as a PDF (steps above) and upload that." }
                        : undefined
                    }
                  />
                </VStack>

                {err && <Banner status="error" title={err} />}
                {saved && <Banner status="success" title="Saved." />}

                <HStack justify="end" gap={2}>
                  <Button label={isEditing ? "Cancel" : "Skip for now"} variant="ghost" isDisabled={busy} onClick={skipOrCancel} />
                  <Button label={isEditing ? "Save changes" : "Save and continue"} variant="primary" isLoading={busy} onClick={save} />
                </HStack>
              </VStack>
            </Card>
          </VStack>
        </LayoutContent>
      }
    />
  );
}
