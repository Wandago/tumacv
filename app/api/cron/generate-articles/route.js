import { supabaseAdmin } from "../../../../lib/supabaseAdmin";
import { INDUSTRIES } from "../../../../lib/gamification";
import { callGemini } from "../../../../lib/gemini";

export const maxDuration = 60;

const ARTICLES_PER_RUN = 2;

const ANGLES = [
  "what's actually changing in hiring for this field right now, and why",
  "the specific skills employers in this field are screening for that most candidates don't realize matter",
  "a mistake job seekers in this field commonly make in their applications, and exactly how to fix it",
  "how compensation and negotiation really works in this field in Kenya",
  "the realistic entry-level pathway into this field for someone with no direct experience",
  "how to build a portfolio or track record in this field when you're just starting out",
  "how remote and hybrid work has changed expectations in this field",
  "what actually separates a shortlisted candidate from the rest in this field",
];

function pickTwo(arr) {
  const a = [...arr];
  const out = [];
  while (out.length < 2 && a.length) {
    out.push(a.splice(Math.floor(Math.random() * a.length), 1)[0]);
  }
  return out;
}

async function chooseIndustries(admin) {
  const pool = INDUSTRIES.filter((i) => i !== "Other");
  const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
  const { data: recent } = await admin
    .from("articles")
    .select("industry")
    .gte("created_at", threeDaysAgo);
  const recentSet = new Set((recent || []).map((r) => r.industry));
  let candidates = pool.filter((i) => !recentSet.has(i));
  if (candidates.length < ARTICLES_PER_RUN) candidates = pool;
  return pickTwo(candidates);
}

async function generateOne(industry) {
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];
  const prompt = `You are a sharp, well-informed careers journalist writing for Kenya's job market — think the quality bar of a good LinkedIn feature or a Business Daily careers column, not generic AI filler.

Write a genuinely detailed, specific article (700-900 words) for job seekers in the ${industry} industry in Kenya, focused on this angle: ${angle}.

Hard rules:
- Open with a real hook — a specific scenario, a sharp observation, or a pointed question. Never open with "In today's fast-paced world" or any throat-clearing.
- Be concrete: name specific skills, specific tactics, specific red flags — not vague encouragement like "stand out" or "put your best foot forward" without saying how.
- Give the reader at least 3 distinct, actionable takeaways they could act on this week.
- Do NOT invent specific statistics, named companies, salary figures, or quotes you cannot verify — write from general informed knowledge of how the field works, not fabricated data points.
- No markdown symbols (no #, *, -). Write in plain paragraphs. You may use short one-line section labels on their own line followed by a blank line if it aids structure, sparingly.
- Grounded in the realities of the Kenyan job market specifically (competition, referral culture, the role of LinkedIn vs. walk-in applications, NGO/corporate/SME differences, etc.) where relevant — don't write something that could apply to any country.
- End with one clear, specific action the reader can take today.

Respond as JSON only: {"title": "a specific, sharp headline — not generic", "content": "the full article, paragraphs separated by \\n\\n"}`;

  const res = await callGemini({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: 2200, responseMimeType: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    if (!parsed.title || !parsed.content || parsed.content.length < 400) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  const provided = url.searchParams.get("secret") || req.headers.get("x-cron-secret");
  const authHeader = req.headers.get("authorization");
  const authorized =
    (process.env.CRON_SECRET && provided === process.env.CRON_SECRET) ||
    (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`);
  if (!authorized) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Missing GEMINI_API_KEY" }, { status: 500 });
  }

  const admin = supabaseAdmin();
  const industries = await chooseIndustries(admin);
  const results = [];

  for (const industry of industries) {
    const article = await generateOne(industry);
    if (!article) {
      results.push({ industry, error: true });
      continue;
    }
    await admin.from("articles").insert({ industry, title: article.title, content: article.content });
    results.push({ industry, created: true, title: article.title });
  }

  return Response.json({ ok: true, results });
}
