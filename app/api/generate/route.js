import { requireUser } from "../../../lib/supabaseAdmin";
import { isUnlimited, FREE_MODE } from "../../../lib/plans";
import { callGemini } from "../../../lib/gemini";

export const maxDuration = 60;

const SYSTEM = `You are a professional CV writer helping Kenyan job seekers tailor their applications.

You will receive a JOB description and a CANDIDATE profile. Produce a tailored CV and cover letter that:
- Reorder and rewrite the candidate's real experience to emphasise what this job asks for.
- NEVER invent employers, job titles, dates, degrees, or certifications the candidate did not provide. You may rephrase and quantify only what is stated or clearly implied.
- Mirror important keywords from the job description naturally (for ATS screening).
- Keep the CV to content that fits roughly 1-2 A4 pages. Bullets start with strong verbs.
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

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) {
      return Response.json({ error: "Please sign in to generate documents.", code: "auth" }, { status: 401 });
    }
    const { user, admin } = authed;

    const { jobText, profileText, template } = await req.json();
    if (!jobText || jobText.trim().length < 80) {
      return Response.json({ error: "The job description looks too short. Paste the full posting." }, { status: 400 });
    }
    if (!profileText || profileText.trim().length < 80) {
      return Response.json({ error: "Add more detail about yourself — work history, education, skills." }, { status: 400 });
    }

    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("credits, plan, plan_expires, streak_count, longest_streak, last_generation_date")
      .eq("id", user.id)
      .single();
    if (pErr || !profile) {
      console.error("Profile lookup failed for", user.id, pErr);
      return Response.json({ error: "Could not load your account. Try signing out and in." }, { status: 500 });
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

    const res = await callGemini({
      systemInstruction: { parts: [{ text: SYSTEM }] },
      contents: [
        {
          role: "user",
          parts: [
            { text: `JOB DESCRIPTION:\n${jobText.slice(0, 14000)}\n\nCANDIDATE PROFILE:\n${profileText.slice(0, 14000)}` },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 4000, responseMimeType: "application/json" },
    });

    if (!res.ok) {
      if (res.status === 429) {
        return Response.json({ error: "The AI is busy right now. Wait a minute and try again — no credit was used." }, { status: 429 });
      }
      return Response.json({ error: "Generation failed. Try again — no credit was used." }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
    const clean = text.replace(/```json|```/g, "").trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start === -1 || end === -1) {
        return Response.json({ error: "Could not read the generated documents. Try again — no credit was used." }, { status: 502 });
      }
      parsed = JSON.parse(clean.slice(start, end + 1));
    }

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
    if (!unlimited) updates.credits = profile.credits - 1;
    await admin.from("profiles").update(updates).eq("id", user.id);

    await admin.from("generations").insert({
      user_id: user.id,
      job_title: parsed.jobTitle || (parsed.cv?.title ?? "Application"),
      template: template || "modern",
      result: parsed,
    });

    return Response.json({ ...parsed, creditsLeft: unlimited ? null : profile.credits - 1 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
