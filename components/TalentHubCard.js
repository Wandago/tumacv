"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { INDUSTRIES, EXPERIENCE_LEVELS } from "../lib/gamification";
import { Card } from "@astryxdesign/core/Card";
import { VStack, HStack, StackItem } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { Button } from "@astryxdesign/core/Button";
import { IconButton } from "@astryxdesign/core/IconButton";
import { Icon } from "@astryxdesign/core/Icon";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Selector } from "@astryxdesign/core/Selector";
import { Banner } from "@astryxdesign/core/Banner";
import { Token } from "@astryxdesign/core/Token";
import { Divider } from "@astryxdesign/core/Divider";
import { Link } from "@astryxdesign/core/Link";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Grid } from "@astryxdesign/core/Grid";
import SkillPicker from "./SkillPicker";
import MyServices from "./MyServices";
import { PlusIcon, UsersIcon } from "../lib/icons";

const MAX_EXPERIENCE = 5;
const MAX_EDUCATION = 3;

function suggestedFields(profile, latestGeneration) {
  const cv = latestGeneration?.result?.cv;
  return {
    displayName: cv?.name ? `${cv.name.split(" ")[0]} ${cv.name.split(" ").slice(-1)[0]?.[0] || ""}.` : "",
    title: cv?.title || "",
    industry: profile?.industry || "",
    experienceLevel: profile?.experience_level || "",
    skills: (cv?.skills || []).slice(0, 6),
    blurb: "",
    experience: (cv?.experience || []).slice(0, MAX_EXPERIENCE).map((e) => ({
      role: e.role || "", company: e.company || "", dates: e.dates || "",
    })),
    education: (cv?.education || []).slice(0, MAX_EDUCATION).map((e) => ({
      degree: e.degree || "", school: e.school || "", dates: e.dates || "",
    })),
  };
}

function fromHubProfile(hubProfile) {
  return {
    displayName: hubProfile.display_name,
    title: hubProfile.title,
    industry: hubProfile.industry || "",
    experienceLevel: hubProfile.experience_level || "",
    skills: hubProfile.skills || [],
    blurb: hubProfile.blurb || "",
    experience: hubProfile.experience || [],
    education: hubProfile.education || [],
  };
}

export default function TalentHubCard({ user, profile, latestGeneration }) {
  const [hubProfile, setHubProfile] = useState(undefined); // undefined = loading, null = not opted in
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [removing, setRemoving] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabaseBrowser().from("hub_profiles").select("*").eq("id", user.id).single()
      .then(({ data }) => setHubProfile(data || null));
  }, [user]);

  function startEdit() {
    setErr("");
    setForm(hubProfile ? fromHubProfile(hubProfile) : suggestedFields(profile, latestGeneration));
    setEditing(true);
  }

  function setField(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addRow(key, empty, max) {
    setForm((f) => (f[key].length >= max ? f : { ...f, [key]: [...f[key], empty] }));
  }
  function updateRow(key, i, field, v) {
    setForm((f) => ({ ...f, [key]: f[key].map((row, j) => (j === i ? { ...row, [field]: v } : row)) }));
  }
  function removeRow(key, i) {
    setForm((f) => ({ ...f, [key]: f[key].filter((_, j) => j !== i) }));
  }

  async function save() {
    setErr("");
    if (!form.displayName.trim() || !form.title.trim()) {
      setErr("A display name and title are required.");
      return;
    }
    setSaving(true);
    const cleanRows = (rows, fields, max) =>
      rows
        .filter((r) => fields.some((f) => r[f]?.trim()))
        .slice(0, max)
        .map((r) => Object.fromEntries(fields.map((f) => [f, (r[f] || "").trim().slice(0, 100)])));
    const row = {
      id: user.id,
      display_name: form.displayName.trim().slice(0, 60),
      title: form.title.trim().slice(0, 80),
      industry: form.industry || null,
      experience_level: form.experienceLevel || null,
      skills: form.skills.slice(0, 15),
      blurb: form.blurb.trim().slice(0, 200) || null,
      experience: cleanRows(form.experience, ["role", "company", "dates"], MAX_EXPERIENCE),
      education: cleanRows(form.education, ["degree", "school", "dates"], MAX_EDUCATION),
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabaseBrowser().from("hub_profiles").upsert(row).select().single();
    setSaving(false);
    if (error) { setErr("Could not save. Try again."); return; }
    setHubProfile(data);
    setEditing(false);
  }

  async function remove() {
    setRemoving(true);
    const { error } = await supabaseBrowser().from("hub_profiles").delete().eq("id", user.id);
    setRemoving(false);
    setConfirmRemove(false);
    if (!error) { setHubProfile(null); setEditing(false); }
  }

  if (hubProfile === undefined) return null;

  const repeatRows = (key, fields, max, empty, addLabel) => (
    <VStack gap={2}>
      {form[key].map((row, i) => (
        <HStack key={i} gap={2} align="end">
          {fields.map(([field, label]) => (
            <StackItem size="fill" key={field}>
              <TextInput label={label} isLabelHidden={i > 0} value={row[field]} onChange={(v) => updateRow(key, i, field, v)} placeholder={label} />
            </StackItem>
          ))}
          <IconButton label="Remove row" variant="ghost" icon={<Icon icon="close" />} onClick={() => removeRow(key, i)} />
        </HStack>
      ))}
      {form[key].length < max && (
        <HStack>
          <Button label={addLabel} size="sm" variant="ghost" icon={<Icon icon={PlusIcon} />} onClick={() => addRow(key, empty, max)} />
        </HStack>
      )}
    </VStack>
  );

  return (
    <Card padding={5}>
      <VStack gap={4}>
        <HStack gap={3} align="start">
          <Icon icon={UsersIcon} color="accent" size="lg" />
          <StackItem size="fill">
            <VStack gap={1}>
              <Heading level={3}>Talent Hub</Heading>
              {!editing && !hubProfile && (
                <Text color="secondary">
                  Publish a short public profile card — name, title, industry, skills, and a few roles if you like — so
                  employers browsing the <Link href="/hub">Talent Hub</Link> can find you. No contact info or full CV is
                  ever shown.
                </Text>
              )}
              {!editing && hubProfile && (
                <Text color="secondary">
                  Your profile is live on the <Link href="/hub">public Talent Hub</Link>.
                </Text>
              )}
              {editing && (
                <Text color="secondary">
                  Visible to anyone on the internet. Only what you fill in below is shown — never your email, phone, or
                  full CV.
                </Text>
              )}
            </VStack>
          </StackItem>
        </HStack>

        {!editing && !hubProfile && (
          <HStack>
            <Button label="Join the Talent Hub" variant="primary" onClick={startEdit} />
          </HStack>
        )}

        {!editing && hubProfile && (
          <>
            <Card variant="muted" padding={4}>
              <VStack gap={2}>
                <VStack gap={0}>
                  <Text weight="bold">{hubProfile.display_name}</Text>
                  <Text color="secondary">{hubProfile.title}</Text>
                </VStack>
                {(hubProfile.skills || []).length > 0 && (
                  <HStack gap={1.5} wrap="wrap">
                    {hubProfile.skills.map((s) => <Token key={s} label={s} size="sm" />)}
                  </HStack>
                )}
                {(hubProfile.experience || []).map((e, i) => (
                  <Text key={`e${i}`} type="supporting">{e.role}{e.company ? ` · ${e.company}` : ""}</Text>
                ))}
                {(hubProfile.education || []).map((e, i) => (
                  <Text key={`d${i}`} type="supporting" color="secondary">{e.degree}{e.school ? ` · ${e.school}` : ""}</Text>
                ))}
              </VStack>
            </Card>
            <HStack gap={2}>
              <Button label="Edit" onClick={startEdit} />
              <Button label="Remove from Talent Hub" variant="ghost" onClick={() => setConfirmRemove(true)} />
            </HStack>
            <Divider />
            <MyServices userId={user.id} />
          </>
        )}

        {editing && (
          <VStack gap={4}>
            <Grid columns={{ minWidth: 220 }} gap={3}>
              <TextInput label="Display name" value={form.displayName} onChange={(v) => setField("displayName", v)} placeholder="e.g. Wanjiru K." />
              <TextInput label="Title / role" value={form.title} onChange={(v) => setField("title", v)} placeholder="e.g. Digital Marketing Specialist" />
              <Selector
                label="Industry"
                hasClear
                placeholder="Not specified"
                value={form.industry}
                onChange={(v) => setField("industry", v || "")}
                options={INDUSTRIES.map((i) => ({ value: i, label: i }))}
              />
              <Selector
                label="Experience level"
                hasClear
                placeholder="Not specified"
                value={form.experienceLevel}
                onChange={(v) => setField("experienceLevel", v || "")}
                options={EXPERIENCE_LEVELS.map((l) => ({ value: l.id, label: l.label }))}
              />
            </Grid>
            <SkillPicker selected={form.skills} onChange={(skills) => setField("skills", skills)} />
            <TextInput
              label="One-line blurb"
              isOptional
              value={form.blurb}
              onChange={(v) => setField("blurb", v)}
              placeholder="A short line about what you're looking for"
            />
            <VStack gap={2}>
              <Text weight="semibold">Work experience <Text color="secondary">(optional)</Text></Text>
              {repeatRows("experience", [["role", "Role"], ["company", "Company"], ["dates", "Dates"]], MAX_EXPERIENCE, { role: "", company: "", dates: "" }, "Add work experience")}
            </VStack>
            <VStack gap={2}>
              <Text weight="semibold">Education <Text color="secondary">(optional)</Text></Text>
              {repeatRows("education", [["degree", "Degree / qualification"], ["school", "School"], ["dates", "Dates"]], MAX_EDUCATION, { degree: "", school: "", dates: "" }, "Add education")}
            </VStack>
            {err && <Banner status="error" title={err} />}
            <HStack gap={2}>
              <Button label={hubProfile ? "Save changes" : "Publish my card"} variant="primary" isLoading={saving} onClick={save} />
              <Button label="Cancel" variant="ghost" onClick={() => setEditing(false)} />
            </HStack>
          </VStack>
        )}
      </VStack>

      <AlertDialog
        isOpen={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove your Talent Hub profile?"
        description="Your card disappears from the public Talent Hub straight away. You can rejoin any time."
        actionLabel="Remove"
        isActionLoading={removing}
        onAction={remove}
      />
    </Card>
  );
}
