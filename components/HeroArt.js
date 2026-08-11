export default function HeroArt() {
  return (
    <svg
      className="hero-art"
      viewBox="0 0 300 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="A generic CV transforming into one tailored to a specific job"
    >
      {/* back card: generic CV */}
      <g transform="rotate(-7 90 120)">
        <rect x="30" y="40" width="150" height="190" rx="12" fill="var(--sheet)" stroke="var(--stone)" strokeWidth="1.5" />
        <rect x="52" y="66" width="70" height="9" rx="4.5" fill="var(--soil)" opacity="0.35" />
        <rect x="52" y="86" width="100" height="6" rx="3" fill="var(--soil)" opacity="0.22" />
        <rect x="52" y="100" width="90" height="6" rx="3" fill="var(--soil)" opacity="0.22" />
        <rect x="52" y="122" width="60" height="7" rx="3.5" fill="var(--soil)" opacity="0.3" />
        <rect x="52" y="140" width="100" height="6" rx="3" fill="var(--soil)" opacity="0.18" />
        <rect x="52" y="154" width="95" height="6" rx="3" fill="var(--soil)" opacity="0.18" />
        <rect x="52" y="168" width="80" height="6" rx="3" fill="var(--soil)" opacity="0.18" />
        <rect x="52" y="190" width="60" height="7" rx="3.5" fill="var(--soil)" opacity="0.3" />
        <rect x="52" y="208" width="100" height="6" rx="3" fill="var(--soil)" opacity="0.18" />
      </g>

      {/* front card: tailored CV, accent-highlighted */}
      <g transform="rotate(5 190 130)">
        <rect x="118" y="48" width="150" height="190" rx="12" fill="var(--sheet)" stroke="var(--kijani)" strokeWidth="2" />
        <rect x="140" y="74" width="76" height="10" rx="5" fill="var(--kijani-dark)" />
        <rect x="140" y="96" width="106" height="6" rx="3" fill="var(--soil)" opacity="0.3" />
        <rect x="140" y="110" width="96" height="6" rx="3" fill="var(--soil)" opacity="0.3" />
        <rect x="140" y="132" width="66" height="8" rx="4" fill="var(--kijani-dark)" opacity="0.85" />
        <rect x="140" y="150" width="106" height="6" rx="3" fill="var(--soil)" opacity="0.22" />
        <rect x="140" y="164" width="100" height="6" rx="3" fill="var(--soil)" opacity="0.22" />
        <rect x="140" y="178" width="88" height="6" rx="3" fill="var(--soil)" opacity="0.22" />
        {/* matched-keyword chips */}
        <rect x="140" y="200" width="42" height="16" rx="8" fill="var(--kijani)" opacity="0.16" />
        <rect x="148" y="206" width="26" height="4" rx="2" fill="var(--kijani-dark)" />
        <rect x="188" y="200" width="34" height="16" rx="8" fill="var(--kijani)" opacity="0.16" />
        <rect x="196" y="206" width="18" height="4" rx="2" fill="var(--kijani-dark)" />
      </g>

      {/* match badge */}
      <circle cx="248" cy="56" r="22" fill="var(--kijani)" />
      <path d="M239 56.5l6 6 13-13" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
