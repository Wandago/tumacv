"use client";
import { Text } from "@astryxdesign/core/Text";
import { normalizeCv } from "../lib/cvResult";
import { resolveTemplate } from "../lib/templates";

function initials(name) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "";
  const first = parts[0][0] || "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

const IconMail = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 7l10 6 10-6" />
  </svg>
);
const IconPhone = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconPin = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconLink = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

function ContactList({ contact, className }) {
  const c = contact || {};
  const items = [
    c.email && { Icon: IconMail, text: c.email },
    c.phone && { Icon: IconPhone, text: c.phone },
    c.location && { Icon: IconPin, text: c.location },
    c.linkedin && { Icon: IconLink, text: c.linkedin },
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map(({ Icon, text }) => (
        <span className="contact-item" key={text}>
          <Icon />
          {text}
        </span>
      ))}
    </div>
  );
}

const list = (xs) => (Array.isArray(xs) ? xs.filter(Boolean) : []);

function Bullets({ items }) {
  const b = list(items);
  return b.length ? <ul>{b.map((x, j) => <li key={j}>{x}</li>)}</ul> : null;
}

function Experience({ items, timeline = false }) {
  return (
    <div className={timeline ? "exp timeline" : "exp"}>
      {list(items).map((e, i) => (
        <div className="exp-item" key={i}>
          <div className="role-row">
            <span className="role">
              {e.role}
              {e.company && <span className="co">{timeline ? " · " : ", "}{e.company}</span>}
            </span>
            <span className="dates">{e.dates}</span>
          </div>
          <Bullets items={e.bullets} />
        </div>
      ))}
    </div>
  );
}

function Education({ items }) {
  return (
    <div className="edu">
      {list(items).map((e, i) => (
        <div className="edu-item" key={i}>
          <div className="role-row">
            <span className="role">{e.degree}</span>
            <span className="dates">{e.dates}</span>
          </div>
          {e.school && <div className="co">{e.school}</div>}
        </div>
      ))}
    </div>
  );
}

function Skills({ items, chips = false, sep = " · " }) {
  const s = list(items);
  if (!s.length) return null;
  return chips ? (
    <div className="chips">{s.map((x) => <span className="chip" key={x}>{x}</span>)}</div>
  ) : (
    <p className="skills-line">{s.join(sep)}</p>
  );
}

// Each section once, by key; designs choose the order and the headings.
function sectionsFor(data, t) {
  const certs = list(data.certifications);
  const heads = t.heads || {};
  return {
    summary: data.summary ? { title: heads.summary || "Profile", body: <p className="summary">{data.summary}</p> } : null,
    experience: list(data.experience).length
      ? { title: heads.experience || "Experience", body: <Experience items={data.experience} timeline={t.timeline} /> }
      : null,
    education: list(data.education).length ? { title: heads.education || "Education", body: <Education items={data.education} /> } : null,
    skills: list(data.skills).length
      ? { title: heads.skills || "Skills", body: <Skills items={data.skills} chips={t.chips} sep={t.sep} /> }
      : null,
    certifications: certs.length
      ? { title: heads.certifications || "Certifications", body: t.chips ? <Skills items={certs} chips /> : <Bullets items={certs} /> }
      : null,
  };
}

function Header({ data, t }) {
  const c = data.contact || {};
  const bits = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);
  return (
    <header className="cv-head">
      {t.monogram && <div className="monogram">{initials(data.name)}</div>}
      <div className="cv-id">
        <h1>{data.name}</h1>
        {data.title && <div className="cv-title">{data.title}</div>}
      </div>
      {t.iconContacts ? <ContactList contact={c} className="cv-contact" /> : bits.length > 0 && <div className="cv-contact">{bits.join("   ·   ")}</div>}
    </header>
  );
}

const Section = ({ s, name }) =>
  s ? (
    <section className={`cv-sec sec-${name}`}>
      <h2>{s.title}</h2>
      {s.body}
    </section>
  ) : null;

// How each design arranges the CV (the look is in app/cv.css).
const DESIGNS = {
  nairobi: { layout: "split", iconContacts: true, main: ["summary", "experience"], side: ["skills", "education", "certifications"], chips: true },
  atlas: { layout: "sidebar", monogram: true, iconContacts: true, timeline: true, main: ["summary", "experience"], side: ["skills", "education", "certifications"], chips: true },
  savannah: { layout: "labelled", order: ["summary", "experience", "education", "skills", "certifications"], heads: { summary: "About" }, sep: "  /  " },
  kilimani: { layout: "single", iconContacts: true, order: ["summary", "experience", "skills", "education", "certifications"], chips: true },
  ivory: { layout: "single", order: ["summary", "experience", "skills", "education", "certifications"] },
  swift: { layout: "single", order: ["summary", "experience", "skills", "education", "certifications"], heads: { summary: "Summary" } },
  campus: { layout: "single", iconContacts: true, order: ["summary", "education", "skills", "experience", "certifications"], chips: true, heads: { summary: "About me", experience: "Experience & projects" } },
  boardroom: { layout: "single", order: ["summary", "experience", "skills", "education", "certifications"], heads: { summary: "Executive profile", experience: "Professional experience", skills: "Core competencies" }, sep: "   •   " },
};

export default function CvView({ data: raw, template }) {
  // Normalizing here too covers CVs saved before the API started doing it.
  const data = normalizeCv(raw);
  if (!data) return <Text color="secondary">This CV couldn't be displayed. Generate it again from the home page.</Text>;
  const id = resolveTemplate(template);
  const t = DESIGNS[id];
  const sec = sectionsFor(data, t);

  if (t.layout === "split" || t.layout === "sidebar") {
    const side = (
      <aside className="side">
        {t.layout === "sidebar" && <Header data={data} t={t} />}
        {t.side.map((k) => <Section key={k} name={k} s={sec[k]} />)}
      </aside>
    );
    return (
      <div className={`cv ${id} layout-${t.layout}`}>
        {t.layout === "split" && <Header data={data} t={t} />}
        <div className="cv-cols">
          {t.layout === "sidebar" && side}
          <div className="main">{t.main.map((k) => <Section key={k} name={k} s={sec[k]} />)}</div>
          {t.layout === "split" && side}
        </div>
      </div>
    );
  }

  return (
    <div className={`cv ${id} layout-${t.layout}`}>
      <Header data={data} t={t} />
      {t.order.map((k) => <Section key={k} name={k} s={sec[k]} />)}
    </div>
  );
}
