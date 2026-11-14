"use client";
import { useState } from "react";
import { Dialog, DialogHeader } from "@astryxdesign/core/Dialog";
import { Layout, LayoutContent, LayoutFooter } from "@astryxdesign/core/Layout";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Grid } from "@astryxdesign/core/Grid";
import { Button } from "@astryxdesign/core/Button";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { Banner } from "@astryxdesign/core/Banner";
import { supabaseBrowser } from "../../lib/supabaseClient";

const EMPTY = { title: "", company: "", location: "", job_type: "Full-time", description: "", how_to_apply: "" };

// Employers post free listings to TumaCV's own board (the "TumaCV" source).
export default function PostJobDialog({ isOpen, onClose, user, onPosted }) {
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const close = (open) => !open && onClose();

  async function post() {
    setErr("");
    if (!form.title || !form.company || form.description.length < 60 || !form.how_to_apply) {
      setErr("Fill in the title, company, a real description (60+ characters), and how to apply.");
      return;
    }
    if (form.title.length > 150 || form.company.length > 150 || form.location.length > 150 ||
        form.job_type.length > 50 || form.description.length > 8000 || form.how_to_apply.length > 500) {
      setErr("One of those fields is too long — trim it down and try again.");
      return;
    }
    setBusy(true);
    const { data, error } = await supabaseBrowser().from("jobs").insert({ ...form, user_id: user.id }).select().single();
    setBusy(false);
    if (error) {
      setErr("Could not post. Try again.");
      return;
    }
    setForm(EMPTY);
    onPosted(data);
  }

  return (
    <Dialog isOpen={isOpen} onOpenChange={close} width={680} maxHeight="88vh" purpose="form">
      <Layout
        header={<DialogHeader title="Post a job — free" subtitle="It shows on TumaCV's jobs page, and candidates can tailor their CV to it in one tap." onOpenChange={close} />}
        content={
          <LayoutContent>
            <VStack gap={4}>
              <Grid columns={{ minWidth: 220 }} gap={3}>
                <TextInput label="Job title" value={form.title} onChange={(v) => set("title", v.slice(0, 150))} placeholder="e.g. Sales Executive" />
                <TextInput label="Company" value={form.company} onChange={(v) => set("company", v.slice(0, 150))} placeholder="e.g. Acme Ltd" />
                <TextInput label="Location" value={form.location} onChange={(v) => set("location", v.slice(0, 150))} placeholder="e.g. Nairobi / Remote" />
                <TextInput label="Type" value={form.job_type} onChange={(v) => set("job_type", v.slice(0, 50))} placeholder="Full-time / Part-time / Gig" />
              </Grid>
              <TextArea label="Description & requirements" rows={7} maxLength={8000} value={form.description} onChange={(v) => set("description", v)} placeholder="Responsibilities, requirements, salary range if you can share it…" />
              <TextInput label="How to apply" value={form.how_to_apply} onChange={(v) => set("how_to_apply", v.slice(0, 500))} placeholder="Application link, email or phone" />
              {err && <Banner status="error" title={err} />}
            </VStack>
          </LayoutContent>
        }
        footer={
          <LayoutFooter>
            <HStack justify="end">
              <Button label="Publish job" variant="primary" isLoading={busy} onClick={post} />
            </HStack>
          </LayoutFooter>
        }
      />
    </Dialog>
  );
}
