import Link from "next/link";

function timeAgo(iso) {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-KE", { day: "numeric", month: "short" });
}

// The reference's right-hand column: things needing attention up top, then a
// reverse-chronological activity feed, then a links block. Every section is
// optional so the Dashboard and Admin can each fill in what they actually have.
export default function ActivityRail({ notices, activity, links, activityTitle = "Activity", emptyActivity }) {
  return (
    <>
      {notices?.length > 0 && (
        <section className="rail-section">
          <h4 className="rail-title">Notifications</h4>
          <div className="rail-notices">
            {notices.map((n) => (
              <button key={n.label} className={`rail-notice ${n.tone || ""}`} onClick={n.onClick} type="button">
                <span className="rail-notice-count">{n.count}</span>
                <span className="rail-notice-label">{n.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="rail-section">
        <h4 className="rail-title">{activityTitle}</h4>
        {activity?.length > 0 ? (
          <div className="rail-feed">
            {activity.map((a) => (
              <div className="rail-item" key={a.id}>
                <span className="rail-avatar">{(a.title || "?").slice(0, 1).toUpperCase()}</span>
                <span className="rail-item-body">
                  <span className="rail-item-title">{a.title}</span>
                  <span className="rail-item-meta">
                    {a.meta}
                    {a.at && <> · {timeAgo(a.at)}</>}
                  </span>
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="field-note">{emptyActivity || "Nothing yet."}</p>
        )}
      </section>

      {links?.length > 0 && (
        <section className="rail-section">
          <h4 className="rail-title">Shortcuts</h4>
          <div className="rail-links">
            {links.map((l) => (
              <Link className="rail-link" href={l.href} key={l.href}>
                <span className="rail-link-label">{l.label}</span>
                <span className="rail-link-arrow">→</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
