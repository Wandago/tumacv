const IconTarget = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </svg>
);
const IconDoc = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />
  </svg>
);

export default function HeroCollage() {
  return (
    <div className="hero-collage">
      <div className="floater floater-1">
        <div className="floater-label">MATCH SCORE</div>
        <div className="floater-big">92%</div>
      </div>

      <div className="floater floater-2">
        <div className="floater-row"><IconTarget /><span>Tailored to this job</span></div>
        <div className="floater-chips">
          <span className="chip">SEO</span>
          <span className="chip">Team Lead</span>
        </div>
      </div>

      <div className="floater floater-3">
        <div className="floater-doc-line big" />
        <div className="floater-doc-line" />
        <div className="floater-doc-line" />
        <div className="floater-doc-line short" />
      </div>

      <div className="floater floater-4 accent">
        <div className="floater-row"><IconDoc /><span>Cover letter</span></div>
        <div className="floater-doc-line on" />
        <div className="floater-doc-line on short" />
      </div>

      <div className="floater floater-5">
        <div className="floater-label">READY IN</div>
        <div className="floater-big small">~60s</div>
      </div>
    </div>
  );
}
