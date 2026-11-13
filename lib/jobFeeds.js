// Online job feeds, normalised into one shape for /api/jobs.
//
// Sources:
//   Himalayas  — free, no key. Remote jobs; filtered server-side to roles open
//                to applicants in Kenya (worldwide or Kenya listed).
//   Remotive   — free, no key. Remote jobs; filtered here to the ones whose
//                required location includes Kenya (Worldwide, Africa, EMEA…).
//   JSearch    — Google for Jobs via RapidAPI: local Kenyan listings from
//                LinkedIn, Indeed, BrighterMonday, company sites and more.
//                Switches on when RAPIDAPI_KEY is set (free tier: 200
//                requests/month, so results are cached for an hour per query).
//   TumaCV     — jobs employers posted on TumaCV's own board.
//
// Attribution: Remotive and Himalayas require every listing to credit them
// and to send applicants to their own job URL — `source` and `applyUrl` carry
// exactly that, and the UI shows "via <source>" on every job.

const DESCRIPTION_LIMIT = 6000;

// Job shape every source is mapped to.
//   id, source, title, company, logo, location, remote, type, postedAt,
//   applyUrl, description (plain text), salary
function job(fields) {
  return {
    id: fields.id,
    source: fields.source,
    title: clean(fields.title, 160),
    company: clean(fields.company, 120) || "Company not listed",
    logo: safeUrl(fields.logo),
    location: clean(fields.location, 120),
    remote: !!fields.remote,
    type: clean(fields.type, 40),
    postedAt: fields.postedAt || null,
    applyUrl: safeUrl(fields.applyUrl),
    howToApply: clean(fields.howToApply, 500),
    description: (fields.description || "").slice(0, DESCRIPTION_LIMIT),
    salary: clean(fields.salary, 80),
  };
}

function clean(s, max) {
  if (s === null || s === undefined) return "";
  return String(s).replace(/\s+/g, " ").trim().slice(0, max);
}

function safeUrl(u) {
  if (!u || typeof u !== "string") return "";
  try {
    const url = new URL(u);
    return /^https?:$/.test(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“", ndash: "–", mdash: "—", hellip: "…", bull: "•" };

// Job descriptions arrive as HTML; the app shows and tailors from plain text.
export function htmlToText(html) {
  if (!html) return "";
  return String(html)
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|li|h[1-6]|tr|ul|ol)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? " ")
    .replace(/[ \t ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function money(min, max, currency, period) {
  if (!min && !max) return "";
  const fmt = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  const range = min && max && min !== max ? `${fmt(min)}–${fmt(max)}` : fmt(min || max);
  const PERIODS = { annual: "yr", annually: "yr", year: "yr", yearly: "yr", month: "mo", monthly: "mo", week: "wk", weekly: "wk", hour: "hr", hourly: "hr", day: "day", daily: "day" };
  const p = String(period || "").toLowerCase();
  const per = p ? `/${PERIODS[p] || p}` : "";
  return `${currency || ""} ${range}${per}`.trim();
}

async function getJson(url, init = {}, revalidate = 1800) {
  const res = await fetch(url, {
    ...init,
    headers: { accept: "application/json", "user-agent": "TumaCV job search (+https://tumacv.vercel.app)", ...(init.headers || {}) },
    signal: AbortSignal.timeout(9000),
    next: { revalidate },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

const FRIENDLY_TYPES = {
  full_time: "Full-time", fulltime: "Full-time",
  part_time: "Part-time", parttime: "Part-time",
  contract: "Contract", contractor: "Contract", freelance: "Freelance",
  internship: "Internship", intern: "Internship", temporary: "Temporary", other: "",
};
const friendlyType = (t) => {
  if (!t) return "";
  const key = String(t).toLowerCase().trim().replace(/[\s_-]+/g, "_");
  return FRIENDLY_TYPES[key] ?? String(t).replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
};

export async function himalayas(q) {
  const params = new URLSearchParams({ country: "KE", sort: "recent" });
  if (q) params.set("q", q);
  const headers = process.env.HIMALAYAS_API_KEY ? { authorization: `Bearer ${process.env.HIMALAYAS_API_KEY}` } : {};
  const data = await getJson(`https://himalayas.app/jobs/api/search?${params}`, { headers });
  return (data.jobs || []).map((j) =>
    job({
      id: `himalayas:${j.guid || j.applicationLink}`,
      source: "Himalayas",
      title: j.title,
      company: j.companyName,
      logo: j.companyLogo,
      location: j.locationRestrictions?.length ? "Remote · open to Kenya" : "Remote · worldwide",
      remote: true,
      type: friendlyType(j.employmentType),
      postedAt: j.pubDate ? new Date(j.pubDate * 1000).toISOString() : null,
      applyUrl: j.applicationLink || j.guid,
      description: htmlToText(j.description) || j.excerpt,
      salary: money(j.minSalary, j.maxSalary, j.currency, j.salaryPeriod),
    })
  );
}

// Remotive's "candidate_required_location" is free text: keep the jobs a
// Kenyan applicant can actually be hired for.
const OPEN_TO_KENYA = /worldwide|anywhere|global|africa|kenya|emea|^$/i;

export async function remotive(q) {
  const params = new URLSearchParams({ limit: "60" });
  if (q) params.set("search", q);
  const data = await getJson(`https://remotive.com/api/remote-jobs?${params}`);
  return (data.jobs || [])
    .filter((j) => OPEN_TO_KENYA.test(String(j.candidate_required_location || "").trim()))
    .map((j) =>
      job({
        id: `remotive:${j.id}`,
        source: "Remotive",
        title: j.title,
        company: j.company_name,
        logo: j.company_logo_url || j.company_logo,
        location: `Remote · ${j.candidate_required_location || "worldwide"}`,
        remote: true,
        type: friendlyType(j.job_type),
        postedAt: j.publication_date ? new Date(j.publication_date + (j.publication_date.endsWith("Z") ? "" : "Z")).toISOString() : null,
        applyUrl: j.url,
        description: htmlToText(j.description),
        salary: j.salary,
      })
    );
}

export const jsearchEnabled = () => !!process.env.RAPIDAPI_KEY;

export async function jsearch(q) {
  if (!jsearchEnabled()) return [];
  const params = new URLSearchParams({
    query: `${q || "jobs"} in Kenya`,
    country: "ke",
    page: "1",
    num_pages: "1",
    date_posted: "month",
  });
  const data = await getJson(
    `https://jsearch.p.rapidapi.com/search?${params}`,
    { headers: { "x-rapidapi-key": process.env.RAPIDAPI_KEY, "x-rapidapi-host": "jsearch.p.rapidapi.com" } },
    3600
  );
  return (data.data || []).map((j) =>
    job({
      id: `jsearch:${j.job_id}`,
      source: j.job_publisher || "Google Jobs",
      title: j.job_title,
      company: j.employer_name,
      logo: j.employer_logo,
      location: j.job_is_remote ? "Remote" : j.job_location || [j.job_city, j.job_country === "KE" ? "Kenya" : j.job_country].filter(Boolean).join(", "),
      remote: j.job_is_remote,
      type: friendlyType(j.job_employment_type),
      postedAt: j.job_posted_at_datetime_utc || null,
      applyUrl: j.job_apply_link,
      description: j.job_description,
      salary: money(j.job_min_salary, j.job_max_salary, j.job_salary_currency, j.job_salary_period),
    })
  );
}

const looksLikeUrl = (s) => /^https?:\/\//i.test((s || "").trim());

export async function tumacvPosts(q, supabase) {
  let query = supabase.from("jobs").select("*").order("created_at", { ascending: false }).limit(40);
  if (q) {
    const term = q.replace(/[%,()]/g, " ").trim();
    if (term) query = query.or(`title.ilike.%${term}%,company.ilike.%${term}%,description.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data || []).map((j) =>
    job({
      id: `tumacv:${j.id}`,
      source: "TumaCV",
      title: j.title,
      company: j.company,
      location: j.location || "Kenya",
      remote: /remote/i.test(j.location || ""),
      type: j.job_type,
      postedAt: j.created_at,
      applyUrl: looksLikeUrl(j.how_to_apply) ? j.how_to_apply.trim() : "",
      howToApply: j.how_to_apply,
      description: j.description,
    })
  );
}

// Drops the same role listed by two sources (same title and company), keeps
// at most three roles per company so one bulk poster can't fill the page,
// then sorts newest first.
const PER_COMPANY = 3;
export function mergeJobs(lists) {
  const seen = new Set();
  const perCompany = new Map();
  const all = [];
  for (const list of lists) {
    for (const j of list) {
      const company = j.company.toLowerCase();
      const key = `${j.title.toLowerCase()}|${company}`;
      if (!j.title || seen.has(key) || (perCompany.get(company) || 0) >= PER_COMPANY) continue;
      seen.add(key);
      perCompany.set(company, (perCompany.get(company) || 0) + 1);
      all.push(j);
    }
  }
  return all.sort((a, b) => (Date.parse(b.postedAt || 0) || 0) - (Date.parse(a.postedAt || 0) || 0));
}
