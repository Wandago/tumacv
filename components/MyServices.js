"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabaseClient";
import { SERVICE_CATEGORIES } from "../lib/serviceCategories";

const MAX_SERVICES = 6;
const EMPTY_FORM = { category: SERVICE_CATEGORIES[0], title: "", description: "", price_kes: "", delivery_days: "" };

export default function MyServices({ userId }) {
  const [services, setServices] = useState(null);
  const [editing, setEditing] = useState(null); // null | "new" | a service id
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [removingId, setRemovingId] = useState("");

  useEffect(() => {
    if (!userId) return;
    supabaseBrowser()
      .from("hub_services")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .then(({ data }) => setServices(data || []));
  }, [userId]);

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
      price_kes: String(s.price_kes),
      delivery_days: s.delivery_days ? String(s.delivery_days) : "",
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

  async function remove(id) {
    if (!confirm("Remove this service listing?")) return;
    setRemovingId(id);
    const { error } = await supabaseBrowser().from("hub_services").delete().eq("id", id);
    setRemovingId("");
    if (!error) setServices((list) => (list || []).filter((s) => s.id !== id));
  }

  if (services === null) return null;

  return (
    <div className="my-services">
      <div className="my-services-head">
        <span className="field-label" style={{ margin: 0 }}>Services you offer (optional)</span>
        {services.length < MAX_SERVICES && editing === null && (
          <button className="btn-ghost" onClick={startNew}>+ Add a service</button>
        )}
      </div>
      <p className="field-note">
        List specific paid services — a CV rewrite, a logo design, a tutoring session — so people
        browsing the <a href="/hub">Talent Hub</a> can hire you directly, not just see your profile.
      </p>

      {services.length > 0 && (
        <div className="service-manage-list">
          {services.map((s) => (
            <div key={s.id} className="service-manage-item">
              <div>
                <span className="hi-title">{s.title}</span>
                <div className="field-note" style={{ marginTop: 2 }}>
                  {s.category} · KES {s.price_kes.toLocaleString()}
                  {s.delivery_days ? ` · ${s.delivery_days}-day delivery` : ""}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button className="btn-ghost" onClick={() => startEdit(s)}>Edit</button>
                <button className="btn-ghost danger-btn" disabled={removingId === s.id} onClick={() => remove(s.id)}>
                  {removingId === s.id ? "…" : "Remove"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <div className="service-form">
          <label className="field-label">Category</label>
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
            {SERVICE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="field-label">Service title</label>
          <input
            type="text" maxLength={100} value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="e.g. I'll rewrite your CV for a specific job"
          />
          <label className="field-label">Description</label>
          <textarea
            maxLength={600} value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="What's included, your process, anything a buyer should know."
          />
          <div className="two-col">
            <div>
              <label className="field-label">Price (KES)</label>
              <input
                type="number" min="1" value={form.price_kes}
                onChange={(e) => setForm((f) => ({ ...f, price_kes: e.target.value }))}
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label className="field-label">Delivery time in days (optional)</label>
              <input
                type="number" min="1" value={form.delivery_days}
                onChange={(e) => setForm((f) => ({ ...f, delivery_days: e.target.value }))}
                placeholder="e.g. 2"
              />
            </div>
          </div>
          {err && <p className="error">{err}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="btn-primary" disabled={saving} onClick={save}>
              {saving ? "Saving…" : "Save service"}
            </button>
            <button className="btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
