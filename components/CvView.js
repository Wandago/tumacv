"use client";

export default function CvView({ data, template }) {
  if (!data) return null;
  const c = data.contact || {};
  const contactBits = [c.email, c.phone, c.location, c.linkedin].filter(Boolean);

  if (template === "modern") {
    return (
      <div className="cv modern">
        <aside className="side">
          <h1>{data.name}</h1>
          <div className="cv-title">{data.title}</div>
          <div className="cv-contact">{contactBits.map((b) => <span key={b}>{b}</span>)}</div>
          <h2>Skills</h2>
          <div>{(data.skills || []).map((s) => <span className="skill-tag" key={s}>{s}</span>)}</div>
          <h2>Education</h2>
          {(data.education || []).map((e, i) => (
            <div key={i} style={{ marginBottom: 8, fontSize: "12px" }}>
              <b>{e.degree}</b><br />{e.school}<br /><span className="dates">{e.dates}</span>
            </div>
          ))}
          {(data.certifications || []).length > 0 && (
            <>
              <h2>Certifications</h2>
              <ul style={{ fontSize: "12px" }}>{data.certifications.map((x) => <li key={x}>{x}</li>)}</ul>
            </>
          )}
        </aside>
        <div>
          <h2 style={{ marginTop: 0 }}>Profile</h2>
          <p>{data.summary}</p>
          <h2>Experience</h2>
          {(data.experience || []).map((e, i) => (
            <div className="exp-item" key={i}>
              <div className="role-row">{e.role} · <span className="co">{e.company}</span></div>
              <div className="dates" style={{ fontSize: "12px" }}>{e.dates}</div>
              <ul>{(e.bullets || []).map((b, j) => <li key={j}>{b}</li>)}</ul>
            </div>
          ))}
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
          <div className="cv-contact">{contactBits.join("   ")}</div>
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
