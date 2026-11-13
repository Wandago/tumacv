// Hand-rolled circular chart (no charting library). Two modes: a single
// progress ring (`pct`, 0-100), or a multi-segment breakdown ring
// (`segments` = [{ label, value }]) drawn as consecutive arcs. `value` and
// `label` are drawn in the centre. Colours are theme tokens, so the chart
// follows light/dark mode.
const SEGMENT_COLORS = [
  "var(--color-accent)",
  "var(--color-icon-teal)",
  "var(--color-icon-cyan)",
  "var(--color-icon-yellow)",
  "var(--color-icon-purple)",
];

export function segmentColor(i) {
  return SEGMENT_COLORS[i % SEGMENT_COLORS.length];
}

export default function DonutChart({ pct, segments, value, label, size = 132, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const mid = size / 2;

  let arcs;
  if (segments?.length) {
    const total = segments.reduce((a, s) => a + s.value, 0);
    let offset = 0;
    arcs = segments.map((s, i) => {
      const frac = total ? s.value / total : 0;
      // 1.5px visual gap between neighbouring arcs, but never a negative dash.
      const len = Math.max(0, frac * c - 1.5);
      const arc = { key: s.label, color: segmentColor(i), dash: `${len} ${c - len}`, offset: -offset };
      offset += frac * c;
      return arc;
    });
  } else {
    const clamped = Math.max(0, Math.min(100, pct || 0));
    arcs = [{ key: "pct", color: "var(--color-accent)", dash: `${(clamped / 100) * c} ${c}`, offset: 0 }];
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${value} ${label || ""}`.trim()}>
      <circle cx={mid} cy={mid} r={r} strokeWidth={stroke} fill="none" style={{ stroke: "var(--color-track)" }} />
      {arcs.map((a) => (
        <circle
          key={a.key}
          cx={mid}
          cy={mid}
          r={r}
          strokeWidth={stroke}
          fill="none"
          style={{ stroke: a.color }}
          strokeDasharray={a.dash}
          strokeDashoffset={a.offset}
          strokeLinecap={segments?.length ? "butt" : "round"}
          transform={`rotate(-90 ${mid} ${mid})`}
        />
      ))}
      <text
        x={mid}
        y={label ? mid - 2 : mid}
        textAnchor="middle"
        dominantBaseline={label ? "auto" : "central"}
        style={{ fill: "var(--color-text-primary)", fontFamily: "var(--font-family-heading)", fontWeight: 700, fontSize: size * 0.2 }}
      >
        {value}
      </text>
      {label && (
        <text
          x={mid}
          y={mid + size * 0.13}
          textAnchor="middle"
          style={{ fill: "var(--color-text-secondary)", fontFamily: "var(--font-family-body)", fontSize: size * 0.095 }}
        >
          {label}
        </text>
      )}
    </svg>
  );
}
