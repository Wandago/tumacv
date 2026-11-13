/**
 * TumaCV "Kijani Pop" theme — every client-facing page (landing, sign-in,
 * the CV builder and result, jobs, pricing, hub, news, support, legal).
 * The dashboard and admin keep their original look (theme/classic.ts).
 *
 * After changing this file, rebuild what the app loads:
 *   npx @astryxdesign/cli theme build theme/tumacv.ts
 *
 * Palette — green leads, everything else supports it:
 *   kijani    #0A7F3F  brand green, primary actions (5.1:1 with white)
 *   forest    #0F3D2A  deep green tiles
 *   lime      #B4EE5E  bright pop
 *   sunshine  #FBD530  warm pop
 *   coral     #FF7A59  warm accent, used sparingly
 *   ink       #0E1A13  green-black text and dark tiles
 *   paper     #F8F7F1  warm off-white page
 * plus soft tints (mint, cream, sand, peach) for quieter tiles. Neutrals are
 * tinted toward green so greys never look cold next to it.
 */
import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

const SYSTEM = 'BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const INK = '#0E1A13';

// Solid colour tiles (components/brand/Tile.js maps tone names to these Card
// variants). Inside a tile, text, icons, borders, fields and primary buttons
// are re-pointed so they read on the tile: ink on light tiles, white on dark
// ones, where the primary button turns white with the tile's colour as label.
// Every pairing passes WCAG AA for body text.
function tile(background: string, onDark: boolean, accentLabel?: string) {
  const fg = onDark ? '#ffffff' : INK;
  return {
    colorScheme: onDark ? 'dark' : 'light',
    borderRadius: 'var(--radius-page)',
    color: fg,
    '--color-text-primary': fg,
    '--color-text-secondary': onDark ? '#ffffffd9' : '#0e1a13bf',
    '--color-text-accent': fg,
    '--color-icon-primary': fg,
    '--color-icon-secondary': onDark ? '#ffffffcc' : '#0e1a13a6',
    '--color-icon-accent': fg,
    '--color-border': onDark ? '#ffffff33' : '#0e1a131f',
    '--color-border-emphasized': onDark ? '#ffffff59' : '#0e1a1340',
    '--color-overlay-hover': onDark ? '#ffffff1a' : '#0e1a1312',
    '--color-overlay-pressed': onDark ? '#ffffff26' : '#0e1a131f',
    '--color-accent': onDark ? '#ffffff' : INK,
    '--color-on-accent': onDark ? accentLabel ?? INK : '#ffffff',
    '--color-background-muted': onDark ? '#ffffff1f' : '#0e1a130f',
    '--color-background-surface': onDark ? '#ffffff1a' : '#ffffff',
  };
}

export const tumacvTheme = defineTheme({
  name: 'tumacv',
  extends: neutralTheme,

  typography: {
    scale: {base: 15, ratio: 1.25},
    // Plus Jakarta Sans for everything you read, Bricolage Grotesque for
    // headlines; Instrument Serif italic is the editorial accent on a word
    // or two (components/brand/Accent.js). All self-hosted latin subsets,
    // loaded in app/layout.js.
    body: {family: 'Plus Jakarta Sans Variable', fallbacks: `-apple-system, ${SYSTEM}`},
    heading: {
      family: 'Bricolage Grotesque Variable',
      fallbacks: `-apple-system, ${SYSTEM}`,
      weights: {1: 'semibold', 2: 'semibold', 3: 'semibold', 4: 'semibold'},
    },
    code: {family: 'ui-monospace', fallbacks: '"SF Mono", Monaco, Consolas, monospace'},
  },

  radius: {base: 6, multiplier: 1.35},

  tokens: {
    '--color-accent': ['#0A7F3F', '#3DDC84'],
    '--color-accent-muted': ['#D9F4E3', '#123A26'],
    '--color-text-accent': ['#087236', '#5FE59A'],
    '--color-icon-accent': ['#0A7F3F', '#3DDC84'],
    '--color-on-accent': ['#FFFFFF', INK],

    '--color-background-body': ['#F8F7F1', '#0B120E'],
    '--color-background-surface': ['#FFFFFF', '#141F18'],
    '--color-background-card': ['#FFFFFF', '#141F18'],
    '--color-background-popover': ['#FFFFFF', '#1B2820'],
    '--color-background-muted': ['#EFEEE5', '#FFFFFF0F'],
    '--color-background-inverted': [INK, '#F1F5EF'],

    '--color-text-primary': [INK, '#F1F5EF'],
    '--color-text-secondary': ['#52605A', '#AEBDB4'],
    '--color-icon-primary': [INK, '#F1F5EF'],
    '--color-icon-secondary': ['#52605A', '#AEBDB4'],
    '--color-border': ['#0E1A1314', '#FFFFFF17'],
    '--color-border-emphasized': ['#D7D8CC', '#2E3D34'],

    '--color-success': ['#0A7F3F', '#3DDC84'],
    '--color-success-muted': ['#0A7F3F1F', '#3DDC8433'],
    '--color-on-success': ['#FFFFFF', INK],

    // Token / badge families, re-tuned to the palette.
    '--color-background-green': ['#0A7F3F1A', '#3DDC8426'],
    '--color-text-green': ['#085F31', '#9DF0C0'],
    '--color-icon-green': ['#0A7F3F', '#3DDC84'],
    '--color-background-yellow': ['#FBD53040', '#FBD53033'],
    '--color-text-yellow': ['#6A5200', '#FFE48A'],
    '--color-icon-yellow': ['#C9A300', '#FBD530'],
    '--color-background-red': ['#FF7A5926', '#FF7A5933'],
    '--color-text-red': ['#A32E14', '#FFB7A3'],
    '--color-icon-red': ['#E0502E', '#FF8F73'],
  },

  components: {
    button: {base: {borderRadius: '9999px'}},
    progressbar: {'variant:accent': {'--color-accent': 'light-dark(#0A7F3F, #3DDC84)'}},
    card: {
      'variant:green': {...tile('#0A7F3F', true, '#0A7F3F'), '--color-background-green': '#0A7F3F'},
      'variant:purple': {...tile('#0F3D2A', true, '#0F3D2A'), '--color-background-purple': '#0F3D2A'},
      'variant:gray': {...tile(INK, true, INK), '--color-background-gray': `light-dark(${INK}, #1B2820)`},
      'variant:cyan': {...tile('#B4EE5E', false), '--color-background-cyan': '#B4EE5E'},
      'variant:yellow': {...tile('#FBD530', false), '--color-background-yellow': '#FBD530'},
      'variant:red': {...tile('#FF7A59', false), '--color-background-red': '#FF7A59'},
      'variant:teal': {...tile('#D9F4E3', false), '--color-background-teal': '#D9F4E3'},
      'variant:orange': {...tile('#FFE4D2', false), '--color-background-orange': '#FFE4D2'},
      'variant:blue': {...tile('#F2EDDD', false), '--color-background-blue': '#F2EDDD'},
      'variant:pink': {...tile('#F1F8D8', false), '--color-background-pink': '#F1F8D8'},
    },
  },
});
