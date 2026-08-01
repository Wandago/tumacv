import { requireUser } from "../../../lib/supabaseAdmin";
import { callGemini } from "../../../lib/gemini";

export const maxDuration = 30;

export async function GET(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) return Response.json({ error: "Sign in first." }, { status: 401 });
    const { user, admin } = authed;

    const { data: profile } = await admin
      .from("profiles")
      .select("industry, experience_level, cached_insight, cached_insight_date")
      .eq("id", user.id)
      .single();

    const today = new Date().toISOString().slice(0, 10);
    if (profile?.cached_insight && profile.cached_insight_date === today) {
      return Response.json({ insight: profile.cached_insight, cached: true });
    }

    if (!profile?.industry) {
      return Response.json({ insight: null, needsOnboarding: true });
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ insight: null });
    }

    const res = await callGemini({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Give one short, specific, practical job-hunting tip (max 45 words, no preamble, no markdown) for a ${profile.experience_level || ""} job seeker in the ${profile.industry} industry in Kenya today. Be concrete — mention a skill, a platform, a certification, or a hiring trend, not generic advice like "network more".`,
            },
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 150 },
    });

    if (!res.ok) return Response.json({ insight: null });

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim();
    if (!text) return Response.json({ insight: null });

    await admin.from("profiles").update({ cached_insight: text, cached_insight_date: today }).eq("id", user.id);
    return Response.json({ insight: text, cached: false });
  } catch (err) {
    console.error(err);
    return Response.json({ insight: null });
  }
}
