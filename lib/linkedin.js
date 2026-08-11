export function isLinkedInUrl(url) {
  try {
    return /(^|\.)linkedin\.com$/i.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

// Catches someone pasting their LinkedIn profile URL into the CV/profile
// text box instead of exporting and uploading the actual PDF — the URL
// alone has no usable content, so this heads that off with a clear nudge.
export function looksLikeBareLinkedInUrl(text) {
  const t = (text || "").trim();
  if (!t || t.length > 150) return false;
  return /^https?:\/\/([\w-]+\.)?linkedin\.com\/\S*$/i.test(t);
}
