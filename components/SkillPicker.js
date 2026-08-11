"use client";
import { useState } from "react";
import { SKILL_OPTIONS, POPULAR_SKILLS } from "../lib/hubSkills";

const MAX_SKILLS = 15;

export default function SkillPicker({ selected, onChange }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const atMax = selected.length >= MAX_SKILLS;

  const pool = q ? SKILL_OPTIONS.filter((s) => s.toLowerCase().includes(q)) : POPULAR_SKILLS;
  const shown = pool.filter((s) => !selected.includes(s)).slice(0, 40);
  const exactMatchExists = SKILL_OPTIONS.some((s) => s.toLowerCase() === q);

  function toggle(skill) {
    if (selected.includes(skill)) onChange(selected.filter((s) => s !== skill));
    else if (!atMax) onChange([...selected, skill]);
  }

  function addCustom() {
    const v = query.trim();
    if (v && !selected.includes(v) && !atMax) {
      onChange([...selected, v]);
      setQuery("");
    }
  }

  return (
    <div className="skill-picker">
      {selected.length > 0 && (
        <div className="skill-picker-selected">
          {selected.map((s) => (
            <button type="button" className="chip chip-removable" key={s} onClick={() => toggle(s)}>
              {s} ✕
            </button>
          ))}
        </div>
      )}
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={atMax ? `Max ${MAX_SKILLS} skills selected` : "Search skills — e.g. Sales, Excel, Nursing…"}
        disabled={atMax}
      />
      {!atMax && (
        <div className="skill-picker-grid">
          {shown.map((s) => (
            <button type="button" className="skill-pick" key={s} onClick={() => toggle(s)}>{s}</button>
          ))}
          {q && !exactMatchExists && (
            <button type="button" className="skill-pick add-custom" onClick={addCustom}>+ Add "{query.trim()}"</button>
          )}
          {shown.length === 0 && !q && <p className="field-note">Type to search — hundreds of skills available.</p>}
        </div>
      )}
      <p className="field-note">{selected.length}/{MAX_SKILLS} selected</p>
    </div>
  );
}
