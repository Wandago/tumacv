export const INDUSTRIES = [
  "Sales & Business Development", "Customer Service", "Administration & Office Support",
  "IT & Software", "Finance & Accounting", "Marketing & Communications",
  "Engineering & Construction", "Healthcare", "Education & Training",
  "Hospitality & Tourism", "Logistics & Supply Chain", "Retail",
  "Human Resources", "Legal", "Creative & Design", "Manufacturing", "Other",
];

export const EXPERIENCE_LEVELS = [
  { id: "graduate", label: "Entry-level / recent graduate" },
  { id: "junior", label: "1–3 years experience" },
  { id: "mid", label: "3–7 years experience" },
  { id: "senior", label: "7+ years / senior" },
];

// An application whose CV covers this share of the job's requirements.
export const HIGH_MATCH = 80;

// Badges deliberately mix three kinds so progress isn't purely a function of
// how many credits someone has spent: volume (`threshold`), quality (match
// score, which costs nothing extra), and outcome (streak kept, job landed).
// The early rungs are reachable inside the free signup credits.
export const BADGES = [
  { id: "first", label: "First Application", emoji: "🌱", threshold: 1, hint: "1 application" },
  { id: "sharp", label: "Sharp Shooter", emoji: "🎯", hint: `One ${HIGH_MATCH}%+ match` },
  { id: "three", label: "Getting Started", emoji: "🚀", threshold: 3, hint: "3 applications" },
  { id: "sharpen", label: "Sharpening Up", emoji: "📈", hint: "Beat your own best match" },
  { id: "streak3", label: "Consistent", emoji: "📅", hint: "A 3-day streak" },
  { id: "ten", label: "On a Roll", emoji: "🔥", threshold: 10, hint: "10 applications" },
  { id: "marksman", label: "Marksman", emoji: "💯", hint: `Five ${HIGH_MATCH}%+ matches` },
  { id: "twentyfive", label: "Job Hunter", emoji: "🎓", threshold: 25, hint: "25 applications" },
  { id: "fifty", label: "Unstoppable", emoji: "🏆", threshold: 50, hint: "50 applications" },
  { id: "hired", label: "Hired!", emoji: "🎉", hint: "Land the job" },
];

// How well a generated CV covered the job's requirements, 0-100.
export function matchScore(fit) {
  if (!fit) return null;
  const matched = (fit.matched || []).length;
  const missing = (fit.missing || []).length;
  const total = matched + missing;
  if (total === 0) return null;
  return Math.round((matched / total) * 100);
}

// Rolls a user's generation history and profile into the numbers the badges
// are judged against. `history` is newest-first, as the dashboard loads it.
export function gamificationStats(history = [], profile = {}) {
  const scores = history.map((h) => matchScore(h.result?.fit)).filter((n) => n !== null);

  // "Beat your own best" is judged over the whole history in chronological
  // order, so the badge can never be taken away by a later weaker application.
  const chrono = [...scores].reverse();
  let improved = false;
  for (let i = 1; i < chrono.length; i++) {
    if (chrono[i] > Math.max(...chrono.slice(0, i))) { improved = true; break; }
  }

  return {
    total: history.length,
    scores,
    bestScore: scores.length ? Math.max(...scores) : null,
    averageScore: scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
    highMatches: scores.filter((n) => n >= HIGH_MATCH).length,
    improved,
    longestStreak: Math.max(profile?.longest_streak || 0, profile?.streak_count || 0),
    hired: !!profile?.hired,
  };
}

export function isEarned(badge, stats) {
  if (badge.threshold) return stats.total >= badge.threshold;
  switch (badge.id) {
    case "sharp": return stats.bestScore !== null && stats.bestScore >= HIGH_MATCH;
    case "sharpen": return stats.improved;
    case "marksman": return stats.highMatches >= 5;
    case "streak3": return stats.longestStreak >= 3;
    case "hired": return stats.hired;
    default: return false;
  }
}

export function earnedBadges(stats) {
  return BADGES.filter((b) => isEarned(b, stats));
}

export function nextBadge(stats) {
  return BADGES.find((b) => !isEarned(b, stats)) || null;
}

// What a badge still needs, as a short nudge. Volume badges can count down;
// the rest just restate what earns them.
export function badgeRemaining(badge, stats) {
  if (badge.threshold) {
    const left = badge.threshold - stats.total;
    return `${left} more application${left === 1 ? "" : "s"}`;
  }
  if (badge.id === "marksman") {
    const left = 5 - stats.highMatches;
    return `${left} more ${HIGH_MATCH}%+ match${left === 1 ? "" : "es"}`;
  }
  return badge.hint;
}

// A streak is only alive if the last generation was today or yesterday. The
// stored streak_count isn't reset until the next generation, so read it
// through here rather than trusting it directly.
export function streakState(profile) {
  const streak = profile?.streak_count || 0;
  const last = profile?.last_generation_date;
  if (!streak || !last) return { streak: 0, status: "none" };

  const today = new Date().toISOString().slice(0, 10);
  const days = Math.round((new Date(today) - new Date(last)) / 86400000);

  if (days <= 0) return { streak, status: "safe" };
  if (days === 1) return { streak, status: "at-risk" };
  return { streak: 0, status: "lapsed", lost: streak };
}
