// JSON.stringify does not escape the "<" character, so a "</script>"
// sequence inside attacker-controlled content (e.g. a job title on a
// user-submitted job posting) can close the surrounding <script> tag and
// inject arbitrary HTML/JS into the page. Replacing "<" with its unicode
// code-point escape neutralizes that while leaving the parsed JSON value
// byte-for-byte identical.
export function safeJsonLd(obj) {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}
