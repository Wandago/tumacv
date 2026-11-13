"use client";
import { useEffect, useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Heading, Text } from "@astryxdesign/core/Text";
import { List, ListItem } from "@astryxdesign/core/List";
import { Button } from "@astryxdesign/core/Button";
import { Card } from "@astryxdesign/core/Card";
import { Selector } from "@astryxdesign/core/Selector";
import { TextInput } from "@astryxdesign/core/TextInput";
import { TextArea } from "@astryxdesign/core/TextArea";
import { NumberInput } from "@astryxdesign/core/NumberInput";
import { Grid } from "@astryxdesign/core/Grid";
import { Banner } from "@astryxdesign/core/Banner";
import { AlertDialog } from "@astryxdesign/core/AlertDialog";
import { Link } from "@astryxdesign/core/Link";
import { Icon } from "@astryxdesign/core/Icon";
import { supabaseBrowser } from "../lib/supabaseClient";
import { SERVICE_CATEGORIES } from "../lib/serviceCategories";
import { PlusIcon } from "../lib/icons";

const MAX_SERVICES = 6;
const EMPTY_FORM = { category: SERVICE_CATEGORIES[0], title: "", description: "", price_kes: null, delivery_days: null };

export default function MyServices({ userId }) {
  const [services, setServices] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | a service id
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    if (!userId) return;
    supabaseBrowser()
      .from("hub_services")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setServices(data || []));
  }, [userId]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  function startNew() {
    setErr("");
    setForm(EMPTY_FORM);
    setEditing("new");
  }

  function startEdit(s) {
    setErr("");
    setForm({
      category: s.category,
      title: s.title,
      description: s.description,
      price_kes: s.price_kes,
      delivery_days: s.delivery_days || null,
    });
    setEditing(s.id);
  }

  async function save() {
    setErr("");
    const price = Number(form.price_kes);
    if (!form.title.trim() || form.description.trim().length < 20) {
      setErr("Add a title and a real description (20+ characters).");
      return;
    }
    if (!price || price < 1) {
      setErr("Enter a valid price in KES.");
      return;
    }
    setSaving(true);
    const row = {
      user_id: userId,
      category: form.category,
      title: form.title.trim().slice(0, 100),
      description: form.description.trim().slice(0, 600),
      price_kes: Math.round(price),
      delivery_days: form.delivery_days ? Number(form.delivery_days) : null,
      updated_at: new Date().toISOString(),
    };
    const sb = supabaseBrowser();
    const { data, error } =
      editing === "new"
        ? await sb.from("hub_services").insert(row).select().single()
        : await sb.from("hub_services").update(row).eq("id", editing).select().single();
    setSaving(false);
    if (error) {
      setErr("Could not save. Try again.");
      return;
    }
    setServices((list) =>
      editing === "new" ? [data, ...(list || [])] : (list || []).map((s) => (s.id === data.id ? data : s))
    );
    setEditing(null);
  }

  async function remove() {
    const id = confirmRemove;
    setRemoving(true);
    const { error } = await supabaseBrowser().from("hub_services").delete().eq("id", id);
    setRemoving(false);
    setConfirmRemove(null);
    if (!error) setServices((list) => (list || []).filter((s) => s.id !== id));
  }

  if (services === null) return null;

  return (
    <VStack gap={3}>
      <HStack justify="between" align="center" gap={3} wrap="wrap">
        <VStack gap={0}>
          <Heading level={4}>Services you offer</Heading>
          <Text color="secondary">
            Optional. List paid services — a CV rewrite, a logo, a tutoring session — so people on the{" "}
            <Link href="/hub">Talent Hub</Link> can hire you directly.
          </Text>
        </VStack>
        {services.length < MAX_SERVICES && editing === null && (
          <Button label="Add a service" size="sm" icon={<Icon icon={PlusIcon} />} onClick={startNew} />
        )}
      </HStack>

      {services.length > 0 && (
        <List hasDividers>
          {services.map((s) => (
            <ListItem
              key={s.id}
              label={s.title}
              description={`${s.category} · KES ${s.price_kes.toLocaleString()}${s.delivery_days ? ` · ${s.delivery_days}-day delivery` : ""}`}
              endContent={
                <HStack gap={1}>
                  <Button label="Edit" size="sm" variant="ghost" onClick={() => startEdit(s)} />
                  <Button label="Remove" size="sm" variant="ghost" onClick={() => setConfirmRemove(s.id)} />
                </HStack>
              }
            />
          ))}
        </List>
      )}

      {editing !== null && (
        <Card variant="muted" padding={5}>
          <VStack gap={4}>
            <Selector
              label="Category"
              value={form.category}
              onChange={set("category")}
              options={SERVICE_CATEGORIES.map((c) => ({ value: c, label: c }))}
            />
            <TextInput label="Service title" value={form.title} onChange={set("title")} placeholder="e.g. I'll rewrite your CV for a specific job" />
            <TextArea
              label="Description"
              maxLength={600}
              rows={4}
              value={form.description}
              onChange={set("description")}
              placeholder="What's included, your process, anything a buyer should know."
            />
            <Grid columns={{ minWidth: 180 }} gap={3}>
              <NumberInput label="Price" units="KES" min={1} value={form.price_kes} onChange={set("price_kes")} placeholder="e.g. 500" />
              <NumberInput label="Delivery time" units="days" isOptional min={1} value={form.delivery_days} onChange={set("delivery_days")} placeholder="e.g. 2" />
            </Grid>
            {err && <Banner status="error" title={err} />}
            <HStack gap={2}>
              <Button label="Save service" variant="primary" isLoading={saving} onClick={save} />
              <Button label="Cancel" variant="ghost" onClick={() => setEditing(null)} />
            </HStack>
          </VStack>
        </Card>
      )}

      <AlertDialog
        isOpen={!!confirmRemove}
        onOpenChange={(open) => !open && setConfirmRemove(null)}
        title="Remove this service?"
        description="It disappears from the Talent Hub straight away. You can add it again later."
        actionLabel="Remove"
        isActionLoading={removing}
        onAction={remove}
      />
    </VStack>
  );
}
