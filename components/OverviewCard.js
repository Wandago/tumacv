import DonutChart, { segmentColor } from "./DonutChart";

// Donut + legend breakdown, the dashboard's headline "what am I made of" card.
// `segments` are [{ label, value }]; `stats` are optional [{ label, value }]
// line items shown underneath (totals, rates — whatever the page cares about).
export default function OverviewCard({ title, segments, centerValue, centerLabel, stats, empty }) {
  const total = segments.reduce((a, s) => a + s.value, 0);

  return (
    <div className="dash-card overview-card">
      <h3>{title}</h3>
      {total === 0 ? (
        <p className="field-note">{empty || "No data yet."}</p>
      ) : (
        <div className="overview-body">
          <DonutChart segments={segments} value={centerValue} label={centerLabel} size={124} stroke={16} />
          <div className="overview-legend">
            {segments.map((s, i) => (
              <div className="overview-legend-row" key={s.label}>
                <span className="overview-swatch" style={{ background: segmentColor(i) }} />
                <span className="overview-legend-label">{s.label}</span>
                <span className="overview-legend-value">
                  {s.value}
                  <span className="overview-legend-pct">{Math.round((s.value / total) * 100)}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {stats?.length > 0 && (
        <div className="overview-stats">
          {stats.map((s) => (
            <div className="overview-stat" key={s.label}>
              <span className="overview-stat-value">{s.value}</span>
              <span className="overview-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
