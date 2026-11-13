/**
 * TumaCV theme — Astryx neutral, re-accented in the TumaCV "kijani" green.
 *
 * This is the editable source. After changing it, rebuild the CSS + JS the
 * app actually loads (needed for SSR, so there's no flash of unstyled
 * components):
 *
 *   npx @astryxdesign/cli theme build theme/tumacv.ts
 *
 * Neutral sets its accent as explicit tokens (near-black), and explicit
 * tokens win over a color.accent seed, so every accent token is overridden
 * here rather than seeding color.accent.
 */
import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

const SYSTEM_FALLBACKS = 'BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

// The bold colour cards ("vivid" cards) on the screens people work in:
// builder, result, dashboard, jobs and the landing page. Each Card colour
// variant becomes a solid, saturated block, and everything inside it (text,
// icons, borders, primary buttons) is re-pointed so it reads on that block.
// Light blocks carry near-black ink; dark blocks carry white, and their
// primary button turns white with the block's own colour as its label.
// Every pairing passes WCAG AA (4.5:1+) for body text.
const INK = '#14121a';
function vivid(background: string, onDark: boolean, accentLabel?: string) {
  const fg = onDark ? '#ffffff' : INK;
  return {
    colorScheme: onDark ? 'dark' : 'light',
    borderRadius: 'var(--radius-page)',
    color: fg,
    '--color-text-primary': fg,
    '--color-text-secondary': onDark ? '#ffffffdb' : '#14121abf',
    '--color-text-accent': fg,
    '--color-icon-primary': fg,
    '--color-icon-secondary': onDark ? '#ffffffcc' : '#14121aa6',
    '--color-icon-accent': fg,
    '--color-border': onDark ? '#ffffff33' : '#14121a26',
    '--color-border-emphasized': onDark ? '#ffffff59' : '#14121a40',
    '--color-overlay-hover': onDark ? '#ffffff1a' : '#14121a12',
    '--color-overlay-pressed': onDark ? '#ffffff26' : '#14121a1f',
    '--color-accent': onDark ? '#ffffff' : INK,
    '--color-on-accent': onDark ? accentLabel ?? INK : '#ffffff',
    '--color-background-muted': onDark ? '#ffffff1f' : '#14121a12',
    // Fields on a dark block read as frosted glass rather than black boxes.
    ...(onDark ? {'--color-background-surface': '#ffffff1f'} : {}),
  };
}

export const tumacvTheme = defineTheme({
  name: 'tumacv',
  extends: neutralTheme,

  // System fonts: no webfont to download on slow mobile data, and each
  // platform's own UI face (SF on iPhone, Roboto on Android, Segoe on Windows).
  typography: {
    scale: {base: 15, ratio: 1.22},
    body: {family: '-apple-system', fallbacks: SYSTEM_FALLBACKS},
    // Headings use Bricolage Grotesque (self-hosted, 41 KB, latin subset,
    // loaded in app/layout.js) — the one webfont, for character where it
    // shows; body text stays on the fast system face.
    heading: {
      family: 'Bricolage Grotesque Variable',
      fallbacks: `-apple-system, ${SYSTEM_FALLBACKS}`,
      weights: {1: 'semibold', 2: 'semibold', 3: 'semibold', 4: 'semibold'},
    },
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
    card: {
      'variant:green': {...vivid('#a5e46f', false), '--color-background-green': '#a5e46f'},
      'variant:purple': {...vivid('#6b3df5', true, '#4b1fd6'), '--color-background-purple': '#6b3df5'},
      'variant:gray': {...vivid('#17151c', true), '--color-background-gray': 'light-dark(#17151c, #262330)'},
      'variant:pink': {...vivid('#f9cde6', false), '--color-background-pink': '#f9cde6'},
      'variant:yellow': {...vivid('#ffd23f', false), '--color-background-yellow': '#ffd23f'},
      'variant:red': {...vivid('#d63a29', true, '#b52a1b'), '--color-background-red': '#d63a29'},
      'variant:blue': {...vivid('#2d5bd7', true, '#1f45ae'), '--color-background-blue': '#2d5bd7'},
      'variant:orange': {...vivid('#ff8c42', false), '--color-background-orange': '#ff8c42'},
      'variant:teal': {...vivid('#1fc7b2', false), '--color-background-teal': '#1fc7b2'},
      'variant:cyan': {...vivid('#bfe9ff', false), '--color-background-cyan': '#bfe9ff'},
    },
    progressbar: {'variant:accent': {'--color-accent': 'light-dark(#0b8a3f, #32d158)'}},
  },
});
