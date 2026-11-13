// Turns Gemini's raw output into the { cv, coverLetter, fit, jobTitle } shape
// the app renders. The model is told the exact shape, but doesn't always
// follow it: it sometimes nests the CV under a different key, returns a list
// as one comma-separated string, or the cover letter as an array of
// paragraphs. Any of those used to reach CvView as `cv: undefined` or a
// string where an array was expected — the cover letter tab worked while the
// CV tab rendered nothing, and the credit was already spent. Pure functions,
// so they run on both the API route and the client.

const str = (v) => (typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "");

function list(v, splitOn = /\s*[,;•·]\s*|\n+/) {
  if (Array.isArray(v)) return v.map((x) => (typeof x === "string" ? x.trim() : x)).filter(Boolean);
  if (typeof v === "string") return v.split(splitOn).map((x) => x.replace(/^[-*•]\s*/, "").trim()).filter(Boolean);
  return [];
}

function maybeJson(v) {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return v;
  }
}

export function normalizeCv(raw) {
  const cv = maybeJson(raw);
  if (!cv || typeof cv !== "object" || Array.isArray(cv)) return null;
  const contact = cv.contact && typeof cv.contact === "object" ? cv.contact : cv;
  return {
    name: str(cv.name),
    title: str(cv.title || cv.headline),
    contact: {
      email: str(contact.email),
      phone: str(contact.phone),
      location: str(contact.location),
      linkedin: str(contact.linkedin),
    },
    summary: str(cv.summary || cv.profile),
    skills: list(cv.skills).filter((s) => typeof s === "string"),
    experience: (Array.isArray(cv.experience) ? cv.experience : [])
      .filter((e) => e && typeof e === "object")
      .map((e) => ({
        role: str(e.role || e.title),
        company: str(e.company || e.employer),
        dates: str(e.dates),
        // Bullets are full sentences, so only split a string on line breaks.
        bullets: list(e.bullets || e.achievements, /\n+/).filter((b) => typeof b === "string"),
      })),
    education: (Array.isArray(cv.education) ? cv.education : [])
      .filter((e) => e && typeof e === "object")
      .map((e) => ({ degree: str(e.degree), school: str(e.school || e.institution), dates: str(e.dates) })),
    certifications: list(cv.certifications, /\n+|\s*;\s*/).filter((c) => typeof c === "string"),
  };
}

export function normalizeResult(raw) {
  const obj = maybeJson(raw);
  if (!obj || typeof obj !== "object") return null;
  // The CV is sometimes nested under another key, or returned flat at the top level.
  const cvSource = obj.cv ?? obj.CV ?? obj.resume ?? (obj.name && obj.experience ? obj : null);
  const letter = obj.coverLetter ?? obj.cover_letter ?? obj.letter;
  const fit = obj.fit && typeof obj.fit === "object" ? obj.fit : {};
  return {
    cv: normalizeCv(cvSource),
    coverLetter: Array.isArray(letter) ? letter.map(str).filter(Boolean).join("\n\n") : str(letter),
    fit: { matched: list(fit.matched), missing: list(fit.missing) },
    jobTitle: str(obj.jobTitle || obj.job_title),
  };
}

// A CV worth showing (and charging for): a name, and some actual content.
export function isUsableCv(cv) {
  return !!(cv && cv.name && (cv.experience.length || cv.education.length || cv.summary));
}

// Pulls the JSON object out of a generateContent response and normalizes it.
// Returns { result } or { error } where error is a short reason for logs.
export function parseGeminiResult(data) {
  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason === "MAX_TOKENS") return { error: "truncated" };
  const text = (candidate?.content?.parts || [])
    .filter((p) => !p.thought)
    .map((p) => p.text || "")
    .join("");
  const clean = text.replace(/```json|```/g, "").trim();
  if (!clean) return { error: `empty output (finishReason ${candidate?.finishReason || "none"})` };

  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start === -1 || end <= start) return { error: "no JSON object in output" };
    try {
      parsed = JSON.parse(clean.slice(start, end + 1));
    } catch {
      return { error: "malformed JSON" };
    }
  }

  const result = normalizeResult(parsed);
  if (!result || !isUsableCv(result.cv)) return { error: "CV missing or empty" };
  if (!result.coverLetter) return { error: "cover letter missing" };
  return { result };
}
