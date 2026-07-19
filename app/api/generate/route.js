export const maxDuration = 60;

const SYSTEM = `You are a professional CV writer helping Kenyan job seekers tailor their applications.

You will receive a JOB description and a CANDIDATE profile. Produce a tailored CV and cover letter that:
- Reorder and rewrite the candidate's real experience to emphasise what this job asks for.
- NEVER invent employers, job titles, dates, degrees, or certifications the candidate did not provide. You may rephrase and quantify only what is stated or clearly implied.
- Mirror important keywords from the job description naturally (for ATS screening).
- Keep the CV to content that fits roughly 1-2 A4 pages. Bullets start with strong verbs.
- Cover letter: 3-4 short paragraphs, specific to this company and role, confident but not exaggerated, no cliches like "I am writing to express". If the company name is unknown, address the hiring manager generically without inventing a name.
- Kenyan context: phone in +254 format if given, do not add photo/age/marital status.

Respond with ONLY a JSON object, no markdown fences, no commentary, matching exactly:
{
  "cv": {
    "name": "", "title": "", 
    "contact": {"email": "", "phone": "", "location": "", "linkedin": ""},
    "summary": "",
    "skills": ["", ""],
    "experience": [{"role": "", "company": "", "dates": "", "bullets": ["", ""]}],
    "education": [{"degree": "", "school": "", "dates": ""}],
    "certifications": ["optional, omit array items if none provided"]
  },
  "coverLetter": "full letter text with \\n\\n between paragraphs, ending with the candidate's name",
  "fit": {
    "matched": ["keywords from the job the candidate genuinely has, max 10"],
    "missing": ["important requirements the candidate lacks, max 5, empty array if none"]
  }
}
Use empty strings for unknown contact fields. Do not fabricate contact details.`;

export async function POST(req) {
  try {
    const { jobText, profileText } = await req.json();

    if (!jobText || jobText.trim().length < 80) {
      return Response.json({ error: "The job description looks too short. Paste the full posting." }, { status: 400 });
    }
    if (!profileText || profileText.trim().length < 80) {
      return Response.json({ error: "Add more detail about yourself — work history, education, skills." }, { status: 400 });
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "Server is missing ANTHROPIC_API_KEY." }, { status: 500 });
    }

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: SYSTEM,
        messages: [
          {
            role: "user",
            content: `JOB DESCRIPTION:\n${jobText.slice(0, 14000)}\n\nCANDIDATE PROFILE:\n${profileText.slice(0, 14000)}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("Anthropic error:", detail);
      return Response.json({ error: "Generation failed. Try again in a moment." }, { status: 502 });
    }

    const data = await res.json();
    const text = (data.content || [])
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    const clean = text.replace(/```json|```/g, "").trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start === -1 || end === -1) {
        return Response.json({ error: "Could not read the generated documents. Try again." }, { status: 502 });
      }
      parsed = JSON.parse(clean.slice(start, end + 1));
    }

    return Response.json(parsed);
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }
}
