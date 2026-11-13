import { requireUser, addCredits } from "../../../lib/supabaseAdmin";
import { isUnlimited, FREE_MODE } from "../../../lib/plans";
import { callGemini } from "../../../lib/gemini";
import { parseGeminiResult } from "../../../lib/cvResult";

export const maxDuration = 60;

const SYSTEM = `You are a professional CV writer helping Kenyan job seekers tailor their applications.

You will receive a JOB description and a CANDIDATE profile. Produce a tailored CV and cover letter that:
- Reorder and rewrite the candidate's real experience to emphasise what this job asks for.
- NEVER invent employers, job titles, dates, degrees, or certifications the candidate did not provide. You may rephrase and quantify only what is stated or clearly implied.
- Mirror important keywords from the job description naturally (for ATS screening).
- Length should match the candidate's real career: a short work history fits comfortably on 1 page — don't pad it. A long, multi-role career should span 2 pages rather than being artificially compressed or dropping earlier roles. Bullets start with strong verbs.
- Cover letter: 3-4 short paragraphs, specific to this company and role, confident but not exaggerated, no cliches like "I am writing to express". If the company name is unknown, address the hiring manager generically without inventing a name.
- Kenyan context: phone in +254 format if given, do not add photo/age/marital status.

Respond with ONLY a JSON object matching exactly:
{
  "cv": {
    "name": "", "title": "",
    "contact": {"email": "", "phone": "", "location": "", "linkedin": ""},
    "summary": "",
    "skills": ["", ""],
    "experience": [{"role": "", "company": "", "dates": "", "bullets": ["", ""]}],
    "education": [{"degree": "", "school": "", "dates": ""}],
    "certifications": []
  },
  "coverLetter": "full letter text with \\n\\n between paragraphs, ending with the candidate's name",
  "fit": {
    "matched": ["keywords from the job the candidate genuinely has, max 10"],
    "missing": ["important requirements the candidate lacks, max 5, empty array if none"]
  },
  "jobTitle": "short title of this job, e.g. 'Sales Executive — Safaricom'"
}
Use empty strings for unknown contact fields. Do not fabricate contact details.`;

// The job an application was tailored for, when it came from the jobs page
// (components/jobs). Stored with the application so the tracker can show the
// company and send the user back to the right "apply" page.
function cleanJobMeta(j) {
  if (!j || typeof j !== "object") return null;
  const str = (v, n) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, n) : "");
  const url = (v) => {
    try {
      const u = new URL(v);
      return /^https?:$/.test(u.protocol) ? u.toString().slice(0, 1000) : "";
    } catch {
      return "";
    }
  };
  const meta = {
    id: str(j.id, 200),
    source: str(j.source, 60),
    title: str(j.title, 160),
    company: str(j.company, 120),
    location: str(j.location, 120),
    applyUrl: url(j.applyUrl),
    howToApply: str(j.howToApply, 500),
  };
  return meta.title ? meta : null;
}

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) {
      return Response.json({ error: "Please sign in to generate documents.", code: "auth" }, { status: 401 });
    }
    const { user, admin } = authed;

    const { jobText, profileText, template, job } = await req.json();
    const jobMeta = cleanJobMeta(job);
    if (!jobText || jobText.trim().length < 80) {
      return Response.json({ error: "The job description looks too short. Paste the full posting." }, { status: 400 });
    }
    if (!profileText || profileText.trim().length < 80) {
      return Response.json({ error: "Add more detail about yourself — work history, education, skills." }, { status: 400 });
    }

    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("credits, plan, plan_expires, streak_count, longest_streak, last_generation_date, banned")
      .eq("id", user.id)
      .single();
    if (pErr || !profile) {
      console.error("Profile lookup failed for", user.id, pErr);
      return Response.json({ error: "Could not load your account. Try signing out and in." }, { status: 500 });
    }
    if (profile.banned) {
      return Response.json({ error: "This account has been suspended. Contact support if you think this is a mistake." }, { status: 403 });
    }
    const unlimited = FREE_MODE || isUnlimited(profile);
    if (!unlimited && profile.credits < 1) {
      return Response.json(
        { error: "You're out of applications. Top up from your dashboard.", code: "credits" },
        { status: 402 }
      );
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Server is missing GEMINI_API_KEY." }, { status: 500 });
    }

    // Each model's output is checked before it's accepted: if it came back
    // cut off, malformed, or without a usable CV, the next model is tried
    // instead of handing the user a blank CV tab.
    const res = await callGemini(
      {
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [
          {
            role: "user",
            parts: [
              { text: `JOB DESCRIPTION:\n${jobText.slice(0, 14000)}\n\nCANDIDATE PROFILE:\n${profileText.slice(0, 14000)}` },
            ],
          },
        ],
        // Long multi-role careers plus a cover letter need the room; the
        // thinking level lib/gemini.js sets keeps reasoning from eating it.
        generationConfig: { maxOutputTokens: 16384, responseMimeType: "application/json" },
      },
      { validate: (data) => parseGeminiResult(data).error || true }
    );

    if (!res.ok) {
      if (res.status === 429) {
        return Response.json({ error: "The AI is busy right now. Wait a minute and try again — no credit was used." }, { status: 429 });
      }
      if (res._detail === "truncated") {
        return Response.json(
          { error: "Your CV came out longer than we could generate in one go. Try trimming the job description or your profile, and try again — no credit was used." },
          { status: 502 }
        );
      }
      if (res.status === 504) {
        return Response.json({ error: "That took longer than usual. Try again — no credit was used." }, { status: 504 });
      }
      return Response.json({ error: "Generation failed. Try again — no credit was used." }, { status: 502 });
    }

    const { result: parsed } = parseGeminiResult(await res.json());

    // Streak tracking
    const today = new Date().toISOString().slice(0, 10);
    let newStreak = 1;
    if (profile.last_generation_date === today) {
      newStreak = profile.streak_count || 1;
    } else if (profile.last_generation_date) {
      const diffDays = Math.round((new Date(today) - new Date(profile.last_generation_date)) / 86400000);
      newStreak = diffDays === 1 ? (profile.streak_count || 0) + 1 : 1;
    }
    const newLongest = Math.max(newStreak, profile.longest_streak || 0);

    const updates = { streak_count: newStreak, longest_streak: newLongest, last_generation_date: today };
    await admin.from("profiles").update(updates).eq("id", user.id);

    // Spend the credit as its own atomic decrement rather than folding
    // `profile.credits - 1` into the update above: two generations running
    // at once both read the same balance, and the second write would undo
    // the first one's spend — handing out a free generation.
    let creditsLeft = null;
    if (!unlimited) {
      const { credits, error: spendErr } = await addCredits(admin, user.id, -1);
      if (spendErr) console.error("generate: could not decrement credits:", spendErr);
      creditsLeft = credits ?? Math.max(0, profile.credits - 1);
    }

    const stored = jobMeta
      ? { ...parsed, job: jobMeta, tracking: { status: "tailored", updatedAt: new Date().toISOString() } }
      : parsed;
    const { data: row, error: insertErr } = await admin
      .from("generations")
      .insert({
        user_id: user.id,
        job_title: jobMeta ? `${jobMeta.title} — ${jobMeta.company}`.slice(0, 200) : parsed.jobTitle || (parsed.cv?.title ?? "Application"),
        template: template || "modern",
        result: stored,
      })
      .select("id")
      .single();
    if (insertErr) console.error("generate: could not save generation:", insertErr);

    return Response.json({ ...stored, id: row?.id ?? null, creditsLeft });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
