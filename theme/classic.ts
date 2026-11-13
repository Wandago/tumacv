/**
 * TumaCV classic theme — the original green look, kept for the signed-in
 * dashboard and the admin panel (app/dashboard/layout.js, app/admin/layout.js),
 * which stay exactly as they were. Everything client-facing uses the Kijani
 * Pop theme in theme/tumacv.ts.
 *
 * This is the editable source. After changing it, rebuild the CSS + JS the
 * app actually loads (needed for SSR, so there's no flash of unstyled
 * components):
 *
 *   npx @astryxdesign/cli theme build theme/classic.ts
 *
 * Neutral sets its accent as explicit tokens (near-black), and explicit
 * tokens win over a color.accent seed, so every accent token is overridden
 * here rather than seeding color.accent.
 */
import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

const SYSTEM_FALLBACKS = 'BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export const classicTheme = defineTheme({
  name: 'tumacv-classic',
  extends: neutralTheme,

  // System fonts: no webfont to download on slow mobile data, and each
  // platform's own UI face (SF on iPhone, Roboto on Android, Segoe on Windows).
  typography: {
    scale: {base: 15, ratio: 1.22},
    body: {family: '-apple-system', fallbacks: SYSTEM_FALLBACKS},
    heading: {family: '-apple-system', fallbacks: SYSTEM_FALLBACKS, weights: {1: 'bold', 2: 'bold', 3: 'bold', 4: 'bold'}},
    code: {
      family: 'ui-monospace',
      fallbacks: '"SF Mono", Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },
  },

  // Slightly softer corners than neutral: friendlier for a consumer product.
  radius: {base: 5, multiplier: 1.25},

  tokens: {
    // Kijani green. Light: #0b8a3f is 4.9:1 against white, so it passes AA
    // both as text on white and as a fill under white text. Dark: the
    // brighter #32d158 reads on dark surfaces, with near-black text on it.
    '--color-accent': ['#0b8a3f', '#32d158'],
    '--color-accent-muted': ['#e3f4e8', '#173a22'],
    '--color-text-accent': ['#08702f', '#5ee07c'],
    '--color-icon-accent': ['#0b8a3f', '#32d158'],
    '--color-on-accent': ['#ffffff', '#06210f'],

    // A faint green cast on the page canvas so the brand reads even on
    // screens without much accent on them.
    '--color-background-body': ['#f3f6f3', '#121413'],
  },

  components: {
    // Pill buttons, matching TumaCV's existing look.
    button: {base: {borderRadius: '9999px'}},
    // Neutral repaints the accent progress bar blue (its "info" colour);
    // TumaCV's progress is the brand green.
    progressbar: {'variant:accent': {'--color-accent': 'light-dark(#0b8a3f, #32d158)'}},
  },
});
