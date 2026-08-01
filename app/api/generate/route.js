import { requireUser } from "../../../lib/supabaseAdmin";
import { isUnlimited } from "../../../lib/plans";

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

const MODEL_CANDIDATES = ["gemini-3.6-flash", "gemini-2.5-flash-lite", "gemini-2.0-flash"];

async function callGemini(body) {
  let lastDetail = "";
  for (const model of MODEL_CANDIDATES) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    if (res.ok) return res;
    lastDetail = await res.text();
    // Only fall through to the next model on a 404 (model retired/renamed).
    // Any other error (bad key, quota, etc.) should surface immediately.
    if (res.status !== 404) {
      console.error(`Gemini error (${model}):`, lastDetail);
      return { ok: false, status: res.status, _detail: lastDetail };
    }
    console.error(`Gemini model unavailable, trying next: ${model}`);
  }
  console.error("All Gemini model candidates failed:", lastDetail);
  return { ok: false, status: 502, _detail: lastDetail };
}

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

    // Credit check
    const { data: profile, error: pErr } = await admin
      .from("profiles")
      .select("credits, plan, plan_expires")
      .eq("id", user.id)
      .single();
    if (pErr || !profile) {
      return Response.json({ error: "Could not load your account. Try signing out and in." }, { status: 500 });
    }
    const unlimited = isUnlimited(profile);
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

    // Success: deduct credit (unless unlimited) and save history
    if (!unlimited) {
      await admin.from("profiles").update({ credits: profile.credits - 1 }).eq("id", user.id);
    }
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
