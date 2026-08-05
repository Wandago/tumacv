import { requireUser } from "../../../lib/supabaseAdmin";
import { callGemini } from "../../../lib/gemini";

export const maxDuration = 45;

const MAX_IMAGES = 4;
const MAX_BYTES_PER_IMAGE = 8 * 1024 * 1024; // 8MB raw, generous for a phone photo

const PROMPT = `You are transcribing a CV/résumé or a LinkedIn profile from one or more photos or
screenshots. Extract all readable text — name, contact details, work experience with dates,
education, skills, certifications — into clean plain text, organized the way a CV normally reads.
If multiple images are provided, they may be different pages or sections of the same profile —
combine them into one coherent document, removing obvious duplication.

Rules:
- Transcribe only what you can actually read. Do not invent, guess, or fill in anything not visible.
- If a word or number is genuinely illegible, write [unclear] rather than guessing.
- No commentary, no markdown formatting — just the transcribed content as plain text.
- If the image doesn't appear to contain a CV or profile at all, respond with exactly: NOT_A_CV`;

export async function POST(req) {
  try {
    const authed = await requireUser(req);
    if (!authed) {
      return Response.json({ error: "Please sign in first.", code: "auth" }, { status: 401 });
    }

    const { images } = await req.json();
    if (!Array.isArray(images) || images.length === 0) {
      return Response.json({ error: "No image provided." }, { status: 400 });
    }
    if (images.length > MAX_IMAGES) {
      return Response.json({ error: `Please upload at most ${MAX_IMAGES} photos at a time.` }, { status: 400 });
    }
    for (const img of images) {
      if (!img.data || !img.mimeType || !img.mimeType.startsWith("image/")) {
        return Response.json({ error: "One of the files isn't a readable image." }, { status: 400 });
      }
      // base64 is ~4/3 the size of the raw bytes
      if (img.data.length > MAX_BYTES_PER_IMAGE * 1.4) {
        return Response.json({ error: "One of those photos is too large. Try a smaller photo or fewer at once." }, { status: 400 });
      }
    }

    if (!process.env.GEMINI_API_KEY) {
      return Response.json({ error: "Server is missing GEMINI_API_KEY." }, { status: 500 });
    }

    const res = await callGemini({
      contents: [
        {
          role: "user",
          parts: [
            { text: PROMPT },
            ...images.map((img) => ({ inlineData: { mimeType: img.mimeType, data: img.data } })),
          ],
        },
      ],
      generationConfig: { maxOutputTokens: 3000 },
    });

    if (!res.ok) {
      if (res.status === 429) {
        return Response.json({ error: "The AI is busy right now. Wait a minute and try again." }, { status: 429 });
      }
      return Response.json({ error: "Couldn't read those photos. Try again, or type your details instead." }, { status: 502 });
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("").trim() || "";

    if (!text || text === "NOT_A_CV") {
      return Response.json(
        { error: "Couldn't find CV content in that photo. Make sure the text is in focus and well-lit, or type your details instead." },
        { status: 422 }
      );
    }

    return Response.json({ text });
  } catch (err) {
    console.error(err);
    return Response.json({ error: "Something went wrong reading that photo. Try again." }, { status: 500 });
  }
}
