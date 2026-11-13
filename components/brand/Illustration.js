// TumaCV's illustration set: flat, chunky objects with one shade side and a
// soft ground shadow, in the Kijani Pop palette (theme/tumacv.ts), drawn to
// sit on paper or on the colour tiles (components/brand/Tile.js).
// Inline SVG so they cost no requests and stay crisp at any size. The colours
// are illustration paint, not UI colour — they're the same in light and dark
// mode, like a printed sticker. `hideOnPhones` drops one that sits beside a
// headline when the screen is too narrow for both; `float` gives it a slow
// idle bob (off for people who prefer reduced motion — app/app.css).

const P = {
  ink: "#0E1A13",
  paper: "#ffffff",
  paperShade: "#e6eee4",
  line: "#d3ded4",
  lime: "#FBD530", // sunshine — ticks and highlights
  limeDeep: "#E0B400",
  purple: "#0A7F3F", // kijani green
  purpleDeep: "#07612F",
  lilac: "#B4EE5E", // lime
  yellow: "#FBD530",
  yellowDeep: "#E0B400",
  coral: "#FF7A59",
  coralDeep: "#E0502E",
  blue: "#0F3D2A", // forest
  sky: "#D9F4E3", // mint
  pink: "#F1F8D8",
  pinkDeep: "#B4EE5E", // lime
  skin: "#8a5a3c",
};

function Svg({ size = 160, title, hideOnPhones = false, float = false, children }) {
  const cls = [hideOnPhones && "hide-on-phones", float && "float"].filter(Boolean).join(" ");
  return (
    <svg
      className={cls || undefined}
      style={{ flexShrink: 0 }}
      viewBox="0 0 200 200"
      width={size}
      height={size}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}

// Four-point sparkle centred on (x, y).
function Sparkle({ x, y, r = 9, fill = P.paper }) {
  const k = r * 0.28;
  return (
    <path
      d={`M${x} ${y - r} Q${x + k} ${y - k} ${x + r} ${y} Q${x + k} ${y + k} ${x} ${y + r} Q${x - k} ${y + k} ${x - r} ${y} Q${x - k} ${y - k} ${x} ${y - r}Z`}
      fill={fill}
    />
  );
}

function Ground({ cx = 100, cy = 182, rx = 62 }) {
  return <ellipse cx={cx} cy={cy} rx={rx} ry={7} fill={P.ink} opacity="0.16" />;
}

/** A tailored CV: two stacked sheets, a profile badge and a green tick. */
export function CvIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <g transform="rotate(-8 100 100)">
        <rect x="52" y="34" width="104" height="136" rx="10" fill={P.pinkDeep} />
      </g>
      <g transform="rotate(5 100 100)">
        <rect x="46" y="28" width="108" height="142" rx="10" fill={P.paperShade} />
        <rect x="46" y="24" width="108" height="142" rx="10" fill={P.paper} />
        <circle cx="72" cy="52" r="13" fill={P.lime} />
        <circle cx="72" cy="48" r="5" fill={P.ink} />
        <path d="M63 60 q9 -9 18 0" fill={P.ink} />
        <rect x="92" y="44" width="48" height="7" rx="3.5" fill={P.ink} />
        <rect x="92" y="56" width="32" height="5" rx="2.5" fill={P.line} />
        {[82, 96, 110, 124, 138].map((y, i) => (
          <g key={y}>
            <circle cx="62" cy={y + 2.5} r="3" fill={i % 2 ? P.purple : P.coral} />
            <rect x="70" y={y} width={i === 2 ? 52 : 70} height="5" rx="2.5" fill={P.line} />
          </g>
        ))}
      </g>
      <circle cx="152" cy="146" r="22" fill={P.limeDeep} />
      <circle cx="150" cy="143" r="22" fill={P.lime} />
      <path d="M140 143 l7 7 l13 -14" fill="none" stroke={P.ink} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      <Sparkle x={40} y={40} r={10} />
      <Sparkle x={166} y={52} r={6} />
    </Svg>
  );
}

/** Finding jobs: a magnifying glass over a briefcase. */
export function JobSearchIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <rect x="40" y="96" width="104" height="76" rx="12" fill={P.coralDeep} />
      <rect x="40" y="92" width="104" height="74" rx="12" fill={P.coral} />
      <path d="M74 92 v-12 a8 8 0 0 1 8 -8 h20 a8 8 0 0 1 8 8 v12" fill="none" stroke={P.ink} strokeWidth="7" />
      <rect x="40" y="118" width="104" height="8" fill={P.coralDeep} />
      <rect x="84" y="112" width="16" height="20" rx="4" fill={P.yellow} />
      <g transform="rotate(-18 128 82)">
        <rect x="150" y="76" width="44" height="14" rx="7" fill={P.ink} />
        <circle cx="128" cy="83" r="34" fill={P.yellowDeep} />
        <circle cx="126" cy="80" r="34" fill={P.yellow} />
        <circle cx="126" cy="80" r="23" fill={P.sky} />
        <path d="M112 72 a16 16 0 0 1 14 -10" fill="none" stroke={P.paper} strokeWidth="6" strokeLinecap="round" />
      </g>
      <Sparkle x={46} y={56} r={11} />
      <Sparkle x={176} y={136} r={7} />
    </Svg>
  );
}

/** Sending an application: a paper plane on a looping trail. */
export function PaperPlaneIllustration(props) {
  return (
    <Svg {...props}>
      <path
        d="M22 160 C 60 150, 50 104, 84 112 S 110 150, 96 128"
        fill="none"
        stroke={P.ink}
        strokeWidth="4"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <ellipse cx="44" cy="70" rx="22" ry="11" fill={P.paper} opacity="0.85" />
      <ellipse cx="58" cy="64" rx="15" ry="12" fill={P.paper} opacity="0.85" />
      <g transform="translate(6 -6)">
        <path d="M86 112 L184 42 L140 156 L118 124 Z" fill={P.paper} />
        <path d="M118 124 L184 42 L112 150 Z" fill={P.paperShade} />
        <path d="M86 112 L118 124 L184 42 Z" fill={P.sky} />
        <path d="M118 124 L112 150 L126 134 Z" fill={P.blue} />
      </g>
      <Sparkle x={160} y={170} r={9} />
      <Sparkle x={30} y={30} r={7} />
    </Svg>
  );
}

/** Speed: a stopwatch with motion lines. */
export function StopwatchIllustration(props) {
  return (
    <Svg {...props}>
      <Ground cx={108} />
      <rect x="96" y="20" width="24" height="16" rx="5" fill={P.ink} />
      <rect x="104" y="32" width="8" height="12" fill={P.ink} />
      <rect x="146" y="44" width="16" height="12" rx="4" fill={P.ink} transform="rotate(40 154 50)" />
      <circle cx="112" cy="110" r="66" fill={P.ink} />
      <circle cx="108" cy="106" r="66" fill={P.purpleDeep} />
      <circle cx="108" cy="106" r="52" fill={P.paper} />
      <path d="M108 106 L108 54 A52 52 0 0 1 156 86 Z" fill={P.lime} />
      {[0, 90, 180, 270].map((a) => (
        <rect key={a} x="105" y="58" width="6" height="12" rx="3" fill={P.ink} transform={`rotate(${a} 108 106)`} />
      ))}
      <path d="M108 106 L138 78" stroke={P.coralDeep} strokeWidth="6" strokeLinecap="round" />
      <circle cx="108" cy="106" r="7" fill={P.ink} />
      {[70, 92, 114].map((y, i) => (
        <rect key={y} x={10 + i * 4} y={y} width={26 - i * 6} height="6" rx="3" fill={P.paper} opacity="0.9" />
      ))}
    </Svg>
  );
}

/** A match: a target with a dart in the bullseye. */
export function TargetIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <circle cx="98" cy="104" r="66" fill={P.coralDeep} />
      <circle cx="94" cy="100" r="66" fill={P.coral} />
      <circle cx="94" cy="100" r="48" fill={P.paper} />
      <circle cx="94" cy="100" r="30" fill={P.coral} />
      <circle cx="94" cy="100" r="13" fill={P.paper} />
      <path d="M94 100 L168 34" stroke={P.ink} strokeWidth="6" strokeLinecap="round" />
      <path d="M156 30 L176 22 L172 44 Z" fill={P.purple} />
      <path d="M160 44 L182 40 L170 58 Z" fill={P.purpleDeep} />
      <Sparkle x={36} y={40} r={10} />
      <Sparkle x={170} y={150} r={8} fill={P.yellow} />
    </Svg>
  );
}

/** Winning: a trophy with sparkles. */
export function TrophyIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <path d="M58 52 h-18 a20 20 0 0 0 26 34" fill="none" stroke={P.yellowDeep} strokeWidth="9" />
      <path d="M142 52 h18 a20 20 0 0 1 -26 34" fill="none" stroke={P.yellowDeep} strokeWidth="9" />
      <path d="M56 40 h88 v30 a44 44 0 0 1 -88 0 Z" fill={P.yellowDeep} />
      <path d="M56 40 h76 v30 a40 44 0 0 1 -76 0 Z" fill={P.yellow} />
      <rect x="90" y="112" width="20" height="30" fill={P.yellowDeep} />
      <rect x="66" y="140" width="68" height="16" rx="5" fill={P.ink} />
      <rect x="58" y="154" width="84" height="20" rx="6" fill={P.purple} />
      <path d="M100 56 l5 11 12 1 -9 8 3 12 -11 -6 -11 6 3 -12 -9 -8 12 -1 Z" fill={P.paper} />
      <Sparkle x={30} y={120} r={10} />
      <Sparkle x={172} y={110} r={12} />
      <Sparkle x={160} y={26} r={6} />
    </Svg>
  );
}

/** Paying with M-Pesa: a phone with coins. */
export function PhoneCoinsIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <g transform="rotate(-10 96 100)">
        <rect x="56" y="22" width="84" height="156" rx="16" fill={P.ink} />
        <rect x="64" y="34" width="68" height="132" rx="9" fill={P.lime} />
        <rect x="74" y="50" width="48" height="8" rx="4" fill={P.ink} />
        <rect x="74" y="66" width="30" height="6" rx="3" fill={P.limeDeep} />
        <rect x="74" y="130" width="48" height="18" rx="9" fill={P.ink} />
        <rect x="88" y="27" width="20" height="4" rx="2" fill={P.paper} opacity="0.4" />
      </g>
      {[
        [150, 150],
        [150, 136],
        [150, 122],
      ].map(([x, y]) => (
        <g key={y}>
          <ellipse cx={x} cy={y + 4} rx="26" ry="9" fill={P.yellowDeep} />
          <ellipse cx={x} cy={y} rx="26" ry="9" fill={P.yellow} />
        </g>
      ))}
      <circle cx="40" cy="128" r="18" fill={P.yellowDeep} />
      <circle cx="38" cy="126" r="18" fill={P.yellow} />
      <path d="M38 116 v20" stroke={P.yellowDeep} strokeWidth="5" strokeLinecap="round" />
      <Sparkle x={168} y={60} r={10} />
    </Svg>
  );
}

/** Choosing a style: three fanned cards. */
export function SwatchIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <rect x="40" y="48" width="78" height="112" rx="12" fill={P.yellow} transform="rotate(-16 80 104)" />
      <rect x="62" y="40" width="78" height="112" rx="12" fill={P.coral} transform="rotate(-2 100 96)" />
      <rect x="84" y="44" width="78" height="112" rx="12" fill={P.purple} transform="rotate(12 122 100)" />
      <g transform="rotate(12 122 100)">
        <rect x="96" y="60" width="40" height="8" rx="4" fill={P.paper} />
        <rect x="96" y="74" width="54" height="5" rx="2.5" fill={P.lilac} />
        <rect x="96" y="86" width="48" height="5" rx="2.5" fill={P.lilac} />
        <rect x="96" y="98" width="52" height="5" rx="2.5" fill={P.lilac} />
        <circle cx="146" cy="138" r="8" fill={P.lime} />
      </g>
      <Sparkle x={36} y={34} r={10} />
    </Svg>
  );
}

/** A friendly person waving a phone — empty states and welcomes. */
export function WaveIllustration(props) {
  return (
    <Svg {...props}>
      <Ground />
      <path d="M48 182 v-36 a52 52 0 0 1 104 0 v36 Z" fill={P.purple} />
      <path d="M100 120 l-14 24 h28 Z" fill={P.paper} />
      <rect x="90" y="96" width="20" height="26" rx="8" fill={P.skin} />
      <circle cx="100" cy="76" r="30" fill={P.skin} />
      <path d="M70 72 a30 30 0 0 1 60 0 c-10 -12 -34 -16 -60 0Z" fill={P.ink} />
      <circle cx="90" cy="80" r="3.5" fill={P.ink} />
      <circle cx="112" cy="80" r="3.5" fill={P.ink} />
      <path d="M92 92 q9 8 18 0" fill="none" stroke={P.ink} strokeWidth="4" strokeLinecap="round" />
      <path d="M150 150 l18 -46" stroke={P.purple} strokeWidth="18" strokeLinecap="round" />
      <circle cx="170" cy="98" r="10" fill={P.skin} />
      <rect x="160" y="62" width="22" height="38" rx="5" fill={P.ink} transform="rotate(14 171 81)" />
      <rect x="163" y="66" width="16" height="28" rx="3" fill={P.lime} transform="rotate(14 171 81)" />
      <Sparkle x={30} y={52} r={10} fill={P.yellow} />
      <Sparkle x={150} y={30} r={7} />
    </Svg>
  );
}
