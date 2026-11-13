// The text the CV is tailored from when applying to a listed job.
export function jobText(job) {
  const head = `${job.title} at ${job.company}${job.location ? ` (${job.location})` : ""}`;
  const extra = [job.type && `Type: ${job.type}`, job.salary && `Salary: ${job.salary}`].filter(Boolean).join("\n");
  return [head, extra, job.description, job.howToApply && `How to apply: ${job.howToApply}`].filter(Boolean).join("\n\n");
}

// The job details stored with the application (app/api/generate cleans them).
export function jobMeta(job) {
  return {
    id: job.id,
    source: job.source,
    title: job.title,
    company: job.company,
    location: job.location,
    applyUrl: job.applyUrl,
    howToApply: job.howToApply,
  };
}

export function postedAgo(iso) {
  const t = Date.parse(iso || "");
  if (!t) return "";
  const days = Math.floor((Date.now() - t) / 86400000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 35) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
