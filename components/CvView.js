"use client";

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

export default function CvView({ data, template }) {
  if (!data) return null;
  const c = data.contact || {};
  const contactBits = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);

  if (template === "modern") {
    return (
      <div className="cv modern">
        <aside className="side">
          <div className="monogram">{initials(data.name)}</div>
          <h1>{data.name}</h1>
          <div className="cv-title">{data.title}</div>
          <ContactList contact={c} className="cv-contact" />
          {(data.skills || []).length > 0 && (
            <>
              <h2>Skills</h2>
              <div>{(data.skills || []).map((s) => <span className="skill-tag" key={s}>{s}</span>)}</div>
            </>
          )}
          <h2>Education</h2>
          {(data.education || []).map((e, i) => (
            <div key={i} className="side-edu">
              <b>{e.degree}</b><br />{e.school}<br /><span className="dates">{e.dates}</span>
            </div>
          ))}
          {(data.certifications || []).length > 0 && (
            <>
              <h2>Certifications</h2>
              <ul className="side-certs">{data.certifications.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          )}
        </aside>
        <div>
          <h2 style={{ marginTop: 0 }}>Profile</h2>
          <p>{data.summary}</p>
          <h2>Experience</h2>
          <div className="timeline">
            {(data.experience || []).map((e, i) => (
              <div className="exp-item" key={i}>
                <div className="role-row">{e.role} · <span className="co">{e.company}</span></div>
                <div className="dates" style={{ fontSize: "12px" }}>{e.dates}</div>
                <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === "compact") {
    return (
      <div className="cv compact">
        <div className="cv-head">
          <h1>{data.name}</h1><span className="cv-title">{data.title}</span>
          <div className="cv-contact">{contactBits.join(" · ")}</div>
        </div>
        <p className="summary">{data.summary}</p>
        <h2>Experience</h2>
        {(data.experience || []).map((e, i) => (
          <div className="exp-item" key={i}>
            <div className="role-row"><span>{e.role}, {e.company}</span><span className="dates">{e.dates}</span></div>
            <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
        <h2>Skills</h2>
        <p className="skills-line">{(data.skills || []).join(" · ")}</p>
        <h2>Education</h2>
        {(data.education || []).map((e, i) => (
          <div className="role-row" key={i}><span>{e.degree}, {e.school}</span><span className="dates">{e.dates}</span></div>
        ))}
        {(data.certifications || []).length > 0 && (
          <><h2>Certifications</h2><p className="skills-line">{data.certifications.join(" · ")}</p></>
        )}
      </div>
    );
  }

  if (template === "minimal") {
    return (
      <div className="cv minimal">
        <div className="cv-head">
          <h1>{data.name}</h1>
          <div className="cv-title">{data.title}</div>
          <ContactList contact={c} className="cv-contact" />
        </div>
        {data.summary && <p className="summary">{data.summary}</p>}
        <h2>Experience</h2>
        {(data.experience || []).map((e, i) => (
          <div className="exp-item" key={i}>
            <div className="role-row"><span>{e.role}</span><span className="dates">{e.dates}</span></div>
            <div className="co">{e.company}</div>
            <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
        <h2>Education</h2>
        {(data.education || []).map((e, i) => (
          <div className="role-row" key={i}><span>{e.degree}, {e.school}</span><span className="dates">{e.dates}</span></div>
        ))}
        <h2>Skills</h2>
        <p className="skills-line">{(data.skills || []).join("   ·   ")}</p>
        {(data.certifications || []).length > 0 && (
          <><h2>Certifications</h2><p className="skills-line">{data.certifications.join("   ·   ")}</p></>
        )}
      </div>
    );
  }

  if (template === "executive") {
    return (
      <div className="cv executive">
        <div className="cv-head">
          <h1>{data.name}</h1>
          <div className="cv-title">{data.title}</div>
          <div className="cv-contact">{contactBits.join("   ·   ")}</div>
        </div>
        <h2>Executive Profile</h2>
        <p>{data.summary}</p>
        <h2>Professional Experience</h2>
        {(data.experience || []).map((e, i) => (
          <div className="exp-item" key={i}>
            <div className="role-row"><span>{e.role} — {e.company}</span><span className="dates">{e.dates}</span></div>
            <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
          </div>
        ))}
        <h2>Core Competencies</h2>
        <p className="skills">{(data.skills || []).join("  •  ")}</p>
        <h2>Education</h2>
        {(data.education || []).map((e, i) => (
          <div className="role-row" key={i}><span>{e.degree}, {e.school}</span><span className="dates">{e.dates}</span></div>
        ))}
        {(data.certifications || []).length > 0 && (
          <><h2>Certifications</h2><p>{data.certifications.join("  •  ")}</p></>
        )}
      </div>
    );
  }

  return (
    <div className="cv classic">
      <div className="cv-head">
        <h1>{data.name}</h1>
        <div className="cv-title">{data.title}</div>
        <div className="cv-contact">{contactBits.join("  ·  ")}</div>
      </div>
      <h2>Profile</h2>
      <p>{data.summary}</p>
      <h2>Experience</h2>
      {(data.experience || []).map((e, i) => (
        <div className="exp-item" key={i}>
          <div className="role-row"><span>{e.role}, {e.company}</span><span className="dates">{e.dates}</span></div>
          <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
        </div>
      ))}
      <h2>Skills</h2>
      <p className="skills">{(data.skills || []).join(" · ")}</p>
      <h2>Education</h2>
      {(data.education || []).map((e, i) => (
        <div className="role-row" key={i}><span>{e.degree}, {e.school}</span><span className="dates">{e.dates}</span></div>
      ))}
      {(data.certifications || []).length > 0 && (
        <><h2>Certifications</h2><p>{data.certifications.join(" · ")}</p></>
      )}
    </div>
  );
}
