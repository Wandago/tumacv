"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "../../lib/supabaseClient";
import { getSavedProfile, setPendingJob } from "../../lib/storage";
import { MIN_CHARS } from "../home/Builder";
import { jobText, jobMeta } from "./jobText";

// One-tap apply: tailor the user's saved CV and a cover letter to a listed
// job, save it to their tracker, and hand back the apply kit.
//
// phase: idle → confirm → generating → done
//        needCv      (no saved CV yet: send them to add it once)
//        needCredits (out of applications: show the top-up dialog)
//        error
export default function useOneTapApply(user) {
  const router = useRouter();
  const [state, setState] = useState({ phase: "idle" });

  function toBuilder(job) {
    setPendingJob({ text: jobText(job) });
    router.push(user ? "/" : "/login?mode=signup");
  }

  async function begin(job) {
    if (!user) return toBuilder(job);
    if (jobText(job).length < MIN_CHARS + 40) {
      setState({ phase: "error", job, message: "This listing is too short to tailor a CV from. Open it on the source site for the full details." });
      return;
    }
    setState({ phase: "loading", job });
    const { data: profile } = await supabaseBrowser()
      .from("profiles")
      .select("profile_text, credits, plan, plan_expires")
      .eq("id", user.id)
      .single();
    const profileText = getSavedProfile(user.id) || profile?.profile_text || "";
    if (profileText.trim().length < MIN_CHARS) {
      setState({ phase: "needCv", job });
      return;
    }
    setState({ phase: "confirm", job, profile, profileText });
  }

  async function confirm(template) {
    const { job, profileText } = state;
    setState({ phase: "generating", job });
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json", authorization: `Bearer ${sess?.session?.access_token}` },
        body: JSON.stringify({ jobText: jobText(job).slice(0, 14000), profileText, template, job: jobMeta(job) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "credits") return setState({ phase: "needCredits", job });
        if (data.code === "auth") return router.push("/login");
        return setState({ phase: "error", job, message: data.error || "Generation failed. Try again — no credit was used." });
      }
      if (!data.cv) return setState({ phase: "error", job, message: "Something went wrong showing your CV. Open it from your dashboard." });
      setState({ phase: "done", job, result: data, template });
      window.scrollTo({ top: 0 });
    } catch {
      setState({ phase: "error", job, message: "Network error. Check your connection and try again." });
    }
  }

  const reset = () => setState({ phase: "idle" });

  return { state, begin, confirm, reset, toBuilder };
}
