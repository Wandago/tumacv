// Profile drafts are scoped per-account so switching accounts on the same
// browser (shared computers, cyber cafés, a borrowed phone) never shows one
// person's saved CV to a different signed-in user. Previously this used one
// shared key ("tumacv-profile") for everyone on the device — that was the bug.
const LEGACY_SHARED_KEY = "tumacv-profile";

function keyFor(userId) {
  return `tumacv-profile-${userId}`;
}

export function getSavedProfile(userId) {
  if (!userId) return "";
  try {
    return localStorage.getItem(keyFor(userId)) || "";
  } catch {
    return "";
  }
}

export function setSavedProfile(userId, text) {
  if (!userId) return;
  try {
    localStorage.setItem(keyFor(userId), text);
  } catch {}
}

// Removes the old unscoped key so any already-leaked draft sitting in a
// browser gets purged the next time the app loads there.
export function clearLegacySharedDraft() {
  try {
    localStorage.removeItem(LEGACY_SHARED_KEY);
  } catch {}
}

// Handoff for the logged-out hero's "paste a job" pill: a visitor can paste
// a job before creating an account, so we stash it here and the main form
// picks it back up once they've signed in.
const PENDING_JOB_KEY = "tumacv-pending-job";

export function setPendingJob({ url = "", text = "" }) {
  try {
    localStorage.setItem(PENDING_JOB_KEY, JSON.stringify({ url, text }));
  } catch {}
}

export function takePendingJob() {
  try {
    const raw = localStorage.getItem(PENDING_JOB_KEY);
    if (!raw) return null;
    localStorage.removeItem(PENDING_JOB_KEY);
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
