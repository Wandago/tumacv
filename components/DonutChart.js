// Hand-rolled circular chart (no charting library), sized via CSS.
// Two modes: a single progress ring (`pct`, 0-100), or a multi-segment
// breakdown ring (`segments` = [{ label, value }]) rendered as consecutive
// arcs around the circle. `label`/`value` render centered inside the ring.
const SEGMENT_COLORS = [
  "var(--kijani-dark)",
  "var(--kijani)",
  "color-mix(in srgb, var(--kijani) 55%, var(--surface-2))",
  "color-mix(in srgb, var(--kijani) 30%, var(--surface-2))",
  "color-mix(in srgb, var(--kijani) 15%, var(--surface-2))",
];

export function segmentColor(i) {
  return SEGMENT_COLORS[i % SEGMENT_COLORS.length];
}

export default function DonutChart({ pct, segments, value, label, size = 132, stroke = 14 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

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
    const clamped = Math.max(0, Math.min(100, pct));
    arcs = [{ key: "pct", color: "var(--kijani-dark)", dash: `${(clamped / 100) * c} ${c}`, offset: 0 }];
  }

  return (
    <div className="donut-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="donut-track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} fill="none" />
        {arcs.map((a) => (
          <circle
            key={a.key}
            className="donut-fill"
            cx={size / 2}
            cy={size / 2}
            r={r}
            strokeWidth={stroke}
            fill="none"
            style={{ stroke: a.color }}
            strokeDasharray={a.dash}
            strokeDashoffset={a.offset}
            strokeLinecap={segments?.length ? "butt" : "round"}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      <div className="donut-center">
        <span className="donut-value">{value}</span>
        {label && <span className="donut-label">{label}</span>}
      </div>
    </div>
  );
}
