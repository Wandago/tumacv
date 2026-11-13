"use client";
import { useEffect, useState } from "react";
import { Center } from "@astryxdesign/core/Center";
import { Spinner } from "@astryxdesign/core/Spinner";
import { supabaseBrowser } from "../lib/supabaseClient";
import { extractPdfText } from "../lib/pdfText";
import { extractImagesToText } from "../lib/imageExtract";
import { getSavedProfile, setSavedProfile, clearLegacySharedDraft, takePendingJob } from "../lib/storage";
import { isLinkedInUrl } from "../lib/linkedin";
import CreditsModal from "../components/CreditsModal";
import Landing from "../components/home/Landing";
import Builder from "../components/home/Builder";
import { DEFAULT_TEMPLATE } from "../lib/templates";
import ResultScreen from "../components/result/ResultScreen";

// The homepage is three screens: the marketing page for visitors, and for
// signed-in users the guided builder, then the result.
export default function Home() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [publicStats, setPublicStats] = useState(null);
  const [jobText, setJobText] = useState("");
  const [jobUrl, setJobUrl] = useState("");
  const [profileText, setProfileText] = useState("");
  const [profileWasSaved, setProfileWasSaved] = useState(false);
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [genErr, setGenErr] = useState("");
  const [needCredits, setNeedCredits] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfErr, setPdfErr] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState("");

  // Profile drafts are scoped per-account (lib/storage.js) so a different
  // person signing into a shared browser never sees someone else's saved CV.
  useEffect(() => {
    clearLegacySharedDraft();
    supabaseBrowser().auth.getUser().then(({ data }) => {
      const u = data?.user || null;
      setUser(u);
      setAuthChecked(true);
      if (u) {
        const draft = getSavedProfile(u.id);
        if (draft) {
          setProfileText(draft);
          setProfileWasSaved(true);
        }
        supabaseBrowser()
          .from("profiles")
          .select("profile_text")
          .eq("id", u.id)
          .single()
          .then(({ data: p }) => {
            if (p?.profile_text && !draft) {
              setProfileText(p.profile_text);
              setProfileWasSaved(true);
              setSavedProfile(u.id, p.profile_text);
            }
          });
      }
    });

    // Picks up whatever a visitor pasted into the landing page before they
    // had an account, so signing up doesn't lose that context.
    const pending = takePendingJob();
    if (pending?.url) setJobUrl(pending.url);
    if (pending?.text) setJobText(pending.text);

    const params = new URLSearchParams(window.location.search);
    const jobid = params.get("jobid");
    if (jobid) {
      supabaseBrowser().from("jobs").select("*").eq("id", jobid).single().then(({ data }) => {
        if (data) {
          setJobText(`${data.title} at ${data.company}${data.location ? ` (${data.location})` : ""}\n\n${data.description}\n\nHow to apply: ${data.how_to_apply}`);
        }
      });
    }

    // Real trust stat for the logged-out homepage — fails silently since
    // it's a nice-to-have, never something that should block the page.
    fetch("/api/admin/public-stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setPublicStats(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!user) return;
    const t = setTimeout(() => setSavedProfile(user.id, profileText), 400);
    return () => clearTimeout(t);
  }, [profileText, user]);

  async function fetchJd() {
    setFetchErr("");
    if (isLinkedInUrl(jobUrl)) {
      setFetchErr(
        "LinkedIn blocks outside tools from reading job posts. Open the listing on LinkedIn, copy the job description text, and paste it below instead."
      );
      return;
    }
    setFetching(true);
    try {
      const res = await fetch("/api/fetch-jd", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: jobUrl }),
      });
      const data = await res.json();
      if (!res.ok) setFetchErr(data.error || "Couldn't read that page.");
      else setJobText(data.text);
    } catch {
      setFetchErr("Couldn't reach that page. Paste the description instead.");
    } finally {
      setFetching(false);
    }
  }

  async function handlePdf(file) {
    setPdfErr("");
    if (file.type !== "application/pdf") {
      setPdfErr("Please upload a PDF file.");
      return;
    }
    setPdfBusy(true);
    try {
      const text = await extractPdfText(file);
      if (text.length < 80) {
        setPdfErr("Couldn't read much text from that PDF — it may be a scanned image. Try the photo option, or paste your details.");
      } else {
        setProfileText(text);
        setProfileWasSaved(false);
      }
    } catch {
      setPdfErr("Couldn't read that PDF. Try re-saving it from LinkedIn, or paste your details instead.");
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
      setProfileWasSaved(false);
    } catch (err) {
      setPhotoErr(err.message || "Couldn't read those photos. Try again, or type your details instead.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function generate() {
    setGenErr("");
    setNeedCredits(false);
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const { data: sess } = await supabaseBrowser().auth.getSession();
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sess?.session?.access_token}`,
        },
        body: JSON.stringify({ jobText, profileText, template }),
      });
      // A platform timeout comes back as an HTML error page, not JSON —
      // reading it as JSON used to throw and show a misleading "Network error".
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.code === "credits") setNeedCredits(true);
        else if (data.code === "auth") window.location.href = "/login";
        else if (data.error) setGenErr(data.error);
        else if (res.status === 504) setGenErr("That took longer than usual. Try again — if no CV appeared, no credit was used.");
        else setGenErr("Generation failed. Try again.");
      } else if (!data.cv) {
        setGenErr("Something went wrong showing your CV. Open it from your dashboard, or try again.");
      } else {
        setResult(data);
        window.scrollTo({ top: 0 });
      }
    } catch {
      setGenErr("Network error. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  // Starts a fresh application: clears the job details but keeps the saved
  // profile and template choice, since that's the part people don't want to
  // re-enter every time they apply to a new posting.
  function newApplication() {
    setResult(null);
    setJobText("");
    setJobUrl("");
    setFetchErr("");
    setGenErr("");
    setNeedCredits(false);
    window.scrollTo({ top: 0 });
  }

  if (!authChecked) {
    return (
      <Center minHeight="60vh">
        <Spinner size="lg" />
      </Center>
    );
  }

  if (!user) return <Landing publicStats={publicStats} />;

  if (result) {
    return (
      <ResultScreen
        result={result}
        template={template}
        setTemplate={setTemplate}
        onBack={() => setResult(null)}
        onNew={newApplication}
      />
    );
  }

  return (
    <>
      <Builder
        jobUrl={jobUrl}
        setJobUrl={setJobUrl}
        jobText={jobText}
        setJobText={setJobText}
        fetchJd={fetchJd}
        fetching={fetching}
        fetchErr={fetchErr}
        profileText={profileText}
        setProfileText={setProfileText}
        profileWasSaved={profileWasSaved}
        onPdf={handlePdf}
        pdfBusy={pdfBusy}
        pdfErr={pdfErr}
        onPhotos={handlePhotos}
        photoBusy={photoBusy}
        photoErr={photoErr}
        template={template}
        setTemplate={setTemplate}
        onGenerate={generate}
        loading={loading}
        genErr={genErr}
      />
      {needCredits && <CreditsModal onClose={() => setNeedCredits(false)} user={user} />}
    </>
  );
}
