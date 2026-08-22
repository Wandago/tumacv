// Small area+line sparkline card. `series` is [{ date, value }].
export default function TrendChart({ title, series, format = (n) => n, loading, className = "" }) {
  if (!series || loading) {
    return (
      <div className={`dash-card trend-card ${className}`}>
        <h3>{title}</h3>
        <div className="loading" style={{ padding: "16px 0" }}><span className="spinner" /></div>
      </div>
    );
  }
  const values = series.map((d) => d.value);
  const max = Math.max(1, ...values);
  const w = 100, h = 34;
  const points = series
    .map((d, i) => `${(i / Math.max(1, series.length - 1)) * w},${h - (d.value / max) * h}`)
    .join(" ");
  const areaPoints = `0,${h} ${points} ${w},${h}`;
  const total = values.reduce((a, b) => a + b, 0);
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
  return (
    <div className={`dash-card trend-card ${className}`}>
      <div className="trend-head">
        <h3>{title}</h3>
        <span className="trend-total">{format(total)}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="trend-svg">
        <polygon points={areaPoints} className="trend-area" />
        <polyline points={points} className="trend-line" />
      </svg>
      <div className="trend-foot">
        <span>{series[0] ? fmtDate(series[0].date) : ""}</span>
        <span>{series[series.length - 1] ? fmtDate(series[series.length - 1].date) : ""}</span>
      </div>
    </div>
  );
}
