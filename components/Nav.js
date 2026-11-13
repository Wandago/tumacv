// Navigation now lives in components/AppFrame.js (the Astryx app shell), so
// every page gets it from the root layout. Kept as a no-op only while pages
// that still render <Nav /> are migrated; delete once nothing imports it.
export default function Nav() {
  return null;
}
