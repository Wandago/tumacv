"use client";
import { useState } from "react";
import { VStack, HStack } from "@astryxdesign/core/Stack";
import { Text } from "@astryxdesign/core/Text";
import { TextInput } from "@astryxdesign/core/TextInput";
import { Token } from "@astryxdesign/core/Token";
import { SKILL_OPTIONS, POPULAR_SKILLS } from "../lib/hubSkills";

const MAX_SKILLS = 15;

export default function SkillPicker({ selected, onChange }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const atMax = selected.length >= MAX_SKILLS;

  const pool = q ? SKILL_OPTIONS.filter((s) => s.toLowerCase().includes(q)) : POPULAR_SKILLS;
  const shown = pool.filter((s) => !selected.includes(s)).slice(0, 30);
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
    <VStack gap={3}>
      {selected.length > 0 && (
        <HStack gap={2} wrap="wrap">
          {selected.map((s) => (
            <Token key={s} label={s} color="green" onRemove={() => toggle(s)} />
          ))}
        </HStack>
      )}
      <TextInput
        label="Skills"
        description={`${selected.length}/${MAX_SKILLS} selected — tap a suggestion to add it.`}
        value={query}
        onChange={setQuery}
        placeholder={atMax ? `Max ${MAX_SKILLS} skills selected` : "Search skills — e.g. Sales, Excel, Nursing…"}
        isDisabled={atMax}
        startIcon="search"
      />
      {!atMax && (
        <HStack gap={2} wrap="wrap">
          {shown.map((s) => (
            <Token key={s} label={s} onClick={() => toggle(s)} />
          ))}
          {q && !exactMatchExists && <Token label={`+ Add "${query.trim()}"`} color="green" onClick={addCustom} />}
          {shown.length === 0 && !q && <Text type="supporting" color="secondary">Type to search — hundreds of skills available.</Text>}
        </HStack>
      )}
    </VStack>
  );
}
