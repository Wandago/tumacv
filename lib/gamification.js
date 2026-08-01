export const INDUSTRIES = [
  "Sales & Business Development", "Customer Service", "Administration & Office Support",
  "IT & Software", "Finance & Accounting", "Marketing & Communications",
  "Engineering & Construction", "Healthcare", "Education & Training",
  "Hospitality & Tourism", "Logistics & Supply Chain", "Retail",
  "Human Resources", "Legal", "Creative & Design", "Manufacturing", "Other",
];

export const BADGES = [
  { threshold: 1, id: "first", label: "First Application", emoji: "🎯" },
  { threshold: 5, id: "five", label: "Getting Started", emoji: "🔥" },
  { threshold: 10, id: "ten", label: "Committed", emoji: "💪" },
  { threshold: 25, id: "twentyfive", label: "Relentless", emoji: "🚀" },
  { threshold: 50, id: "fifty", label: "Unstoppable", emoji: "🏆" },
];

export function earnedBadges(count) {
  return BADGES.filter((b) => count >= b.threshold);
}

export function nextBadge(count) {
  return BADGES.find((b) => count < b.threshold) || null;
}
