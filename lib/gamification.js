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

export const BADGES = [
  { id: "first", label: "First Application", emoji: "🌱", threshold: 1 },
  { id: "five", label: "Getting Started", emoji: "🚀", threshold: 5 },
  { id: "ten", label: "On a Roll", emoji: "🔥", threshold: 10 },
  { id: "twentyfive", label: "Job Hunter", emoji: "🎯", threshold: 25 },
  { id: "fifty", label: "Unstoppable", emoji: "🏆", threshold: 50 },
];

export function earnedBadges(totalGenerations) {
  return BADGES.filter((b) => totalGenerations >= b.threshold);
}

export function nextBadge(totalGenerations) {
  return BADGES.find((b) => totalGenerations < b.threshold) || null;
}
