"use client";
import { useState } from "react";
import Link from "next/link";

// Small stroke-icon set, reused across the Dashboard and Admin sidebars —
// deliberately generic/minimal rather than a full icon library dependency.
const Icon = {
  grid: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="8" height="8" rx="2" /><rect x="13" y="3" width="8" height="8" rx="2" />
      <rect x="3" y="13" width="8" height="8" rx="2" /><rect x="13" y="13" width="8" height="8" rx="2" />
    </svg>
  ),
  briefcase: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /><path d="M2 13h20" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  doc: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h6" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41 12 22l-9-9 8.59-8.59A2 2 0 0 1 13 4h6a2 2 0 0 1 2 2v6a2 2 0 0 1-.41 1.41z" /><circle cx="15.5" cy="8.5" r="1.5" />
    </svg>
  ),
  help: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 1 1 3.4 2.32c-.72.3-1.4.9-1.4 1.68v.5" /><circle cx="12" cy="17" r="0.6" fill="currentColor" />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2 4 5v6c0 5 3.4 8.4 8 11 4.6-2.6 8-6 8-11V5z" />
    </svg>
  ),
  card: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20" />
    </svg>
  ),
  gift: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="8" width="18" height="4" /><path d="M12 8v13M19 12v9H5v-9" />
      <path d="M12 8c-1.2 0-4-.3-4-2.5S10 3 12 8Zm0 0c1.2 0 4-.3 4-2.5S14 3 12 8Z" />
    </svg>
  ),
  megaphone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11v3a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1Z" /><path d="M15 8a4 4 0 0 1 0 8" /><path d="M18 5a8 8 0 0 1 0 14" />
    </svg>
  ),
  trend: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17 9 11l4 4 8-8" /><path d="M15 7h6v6" />
    </svg>
  ),
  gear: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  ),
  logout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="M16 17l5-5-5-5" /><path d="M21 12H9" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><path d="m12 19-7-7 7-7" />
    </svg>
  ),
};

function ItemRow({ item, active, onSelect }) {
  const inner = (
    <>
      <span className="app-sidebar-icon">{Icon[item.icon]}</span>
      <span>{item.label}</span>
      {item.badge != null && <span className="app-sidebar-badge">{item.badge}</span>}
    </>
  );
  const className = `app-sidebar-link ${active ? "on" : ""}`;
  if (item.href) {
    return <Link href={item.href} className={className} onClick={onSelect}>{inner}</Link>;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={() => { item.onClick?.(); onSelect?.(); }}
    >
      {inner}
    </button>
  );
}

// Shared shell for the Dashboard and Admin — a persistent left sidebar
// (nav section + a general/account section pinned to the bottom) with the
// page content rendered alongside it. `items` and `bottomItems` accept
// either { href } (real navigation) or { onClick } (in-page tab switch,
// used by Admin) entries; `activeKey` marks which one is highlighted.
export default function AppSidebar({ sectionLabel = "MENU", items, bottomItems, activeKey, children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link href="/" className="app-sidebar-logo" style={{ textDecoration: "none", color: "inherit" }}>
          Tuma<span>CV</span>
        </Link>

        <div className="app-sidebar-section-label">{sectionLabel}</div>
        <nav className="app-sidebar-nav">
          {items.map((item) => (
            <ItemRow key={item.key} item={item} active={activeKey === item.key} />
          ))}
        </nav>

        <div className="app-sidebar-spacer" />

        {bottomItems && (
          <>
            <div className="app-sidebar-section-label">GENERAL</div>
            <nav className="app-sidebar-nav">
              {bottomItems.map((item) => (
                <ItemRow key={item.key} item={item} active={activeKey === item.key} />
              ))}
            </nav>
          </>
        )}
      </aside>

      {/* Mobile: sidebar collapses to a topbar with a hamburger that opens
          a full nav panel, matching the site's main Nav component instead
          of leaving mobile without any obvious way to see all the links. */}
      <div className="app-topbar-mobile">
        <Link href="/" className="app-sidebar-logo" style={{ textDecoration: "none", color: "inherit" }} onClick={close}>
          Tuma<span>CV</span>
        </Link>
        <button
          type="button"
          className="app-hamburger"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
      {menuOpen && (
        <nav className="app-sidebar-mobile-panel">
          <div className="app-sidebar-section-label">{sectionLabel}</div>
          {items.map((item) => (
            <ItemRow key={item.key} item={item} active={activeKey === item.key} onSelect={close} />
          ))}
          {bottomItems && (
            <>
              <div className="app-sidebar-section-label">GENERAL</div>
              {bottomItems.map((item) => (
                <ItemRow key={item.key} item={item} active={activeKey === item.key} onSelect={close} />
              ))}
            </>
          )}
        </nav>
      )}

      <main className="app-main">{children}</main>
    </div>
  );
}
