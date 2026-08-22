const STAGES = [
  { label: "Paste a job", sub: "any posting, any board" },
  { label: "AI tailors it", sub: "keywords, ordering, emphasis" },
  { label: "Check your match", sub: "score + what's missing" },
  { label: "Send it", sub: "CV + cover letter, ready" },
];

// A Circle-style "growth curve" — decorative, but the milestones are
// TumaCV's actual four steps rather than generic funnel stages.
export default function GrowthLine() {
  return (
    <div className="growth-line">
      <svg viewBox="0 0 800 160" className="growth-line-svg" preserveAspectRatio="none" aria-hidden="true">
        <path d="M 20 140 Q 200 140 260 90 T 520 55 T 780 20" className="growth-line-path" />
        {[[20, 140], [260, 90], [520, 55], [780, 20]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="7" className="growth-line-dot" />
        ))}
      </svg>
      <div className="growth-line-labels">
        {STAGES.map((s) => (
          <div className="growth-line-label" key={s.label}>
            <b>{s.label}</b>
            <span>{s.sub}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
