/**
 * TumaCV "Sunset Pop" theme — every client-facing page (landing, sign-in,
 * the CV builder and result, jobs, pricing, hub, news, support, legal).
 * The dashboard and admin keep the original look (theme/classic.ts).
 *
 * After changing this file, rebuild what the app loads:
 *   npx @astryxdesign/cli theme build theme/tumacv.ts
 *
 * Palette. The pops share lightness and chroma in OKLCH, so they sit together
 * instead of fighting; one deep ink and a warm paper hold them:
 *   magenta   #DA008F  brand, primary actions
 *   coral     #F84B4B
 *   tangerine #FE860F
 *   sunshine  #FBD530
 *   plum      #6B1D7B
 *   ink       #15111F  text, dark tiles
 *   paper     #FCF8F4  page
 * plus soft tints of the same hues (blush, peach, butter, lilac) for quieter
 * tiles. There is deliberately no green anywhere in the brand.
 */
import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

const SYSTEM = 'BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const INK = '#15111F';

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
    '--color-text-secondary': onDark ? '#ffffffd9' : '#15111fbf',
    '--color-text-accent': fg,
    '--color-icon-primary': fg,
    '--color-icon-secondary': onDark ? '#ffffffcc' : '#15111fa6',
    '--color-icon-accent': fg,
    '--color-border': onDark ? '#ffffff33' : '#15111f1f',
    '--color-border-emphasized': onDark ? '#ffffff59' : '#15111f40',
    '--color-overlay-hover': onDark ? '#ffffff1a' : '#15111f12',
    '--color-overlay-pressed': onDark ? '#ffffff26' : '#15111f1f',
    '--color-accent': onDark ? '#ffffff' : INK,
    '--color-on-accent': onDark ? accentLabel ?? INK : '#ffffff',
    '--color-background-muted': onDark ? '#ffffff1f' : '#15111f0f',
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
    '--color-accent': ['#DA008F', '#FF4FB0'],
    '--color-accent-muted': ['#FFE1F1', '#3B1531'],
    '--color-text-accent': ['#B5007A', '#FF85C8'],
    '--color-icon-accent': ['#DA008F', '#FF4FB0'],
    '--color-on-accent': ['#FFFFFF', INK],

    '--color-background-body': ['#FCF8F4', '#110D17'],
    '--color-background-surface': ['#FFFFFF', '#1B1524'],
    '--color-background-card': ['#FFFFFF', '#1B1524'],
    '--color-background-popover': ['#FFFFFF', '#241C2F'],
    '--color-background-muted': ['#F5EEE8', '#FFFFFF0F'],
    '--color-background-inverted': [INK, '#F7F2EE'],

    '--color-text-primary': [INK, '#F7F2EE'],
    '--color-text-secondary': ['#5E566B', '#BAB1C5'],
    '--color-icon-primary': [INK, '#F7F2EE'],
    '--color-icon-secondary': ['#5E566B', '#BAB1C5'],
    '--color-border': ['#15111F14', '#FFFFFF17'],
    '--color-border-emphasized': ['#DED5CD', '#3A3146'],

    // "Success" (a filled-in field, a confirmation banner) in brand plum
    // instead of the stock green, which fights the palette.
    '--color-success': ['#7A2E8E', '#D58BE5'],
    '--color-success-muted': ['#7A2E8E1F', '#D58BE533'],
    '--color-on-success': ['#FFFFFF', INK],

    // Token / badge families, re-tuned to the palette.
    '--color-background-pink': ['#DA008F1A', '#DA008F33'],
    '--color-text-pink': ['#9C0066', '#FFA3D6'],
    '--color-icon-pink': ['#DA008F', '#FF4FB0'],
    '--color-background-purple': ['#6B1D7B1A', '#B85CCB33'],
    '--color-text-purple': ['#56145F', '#E7BCF0'],
    '--color-icon-purple': ['#6B1D7B', '#D58BE5'],
    '--color-background-orange': ['#FE860F24', '#FE860F33'],
    '--color-text-orange': ['#874000', '#FFC58C'],
    '--color-icon-orange': ['#E36F00', '#FE9A3A'],
    '--color-background-yellow': ['#FBD53040', '#FBD53033'],
    '--color-text-yellow': ['#6A5200', '#FFE48A'],
    '--color-icon-yellow': ['#C9A300', '#FBD530'],
    '--color-background-red': ['#F84B4B1F', '#F84B4B33'],
    '--color-text-red': ['#A1191C', '#FFB3B3'],
    '--color-icon-red': ['#E03535', '#FF7070'],
  },

  components: {
    button: {base: {borderRadius: '9999px'}},
    progressbar: {'variant:accent': {'--color-accent': 'light-dark(#DA008F, #FF4FB0)'}},
    card: {
      'variant:pink': {...tile('#DA008F', true, '#A8006E'), '--color-background-pink': '#DA008F'},
      'variant:red': {...tile('#F84B4B', false), '--color-background-red': '#F84B4B'},
      'variant:orange': {...tile('#FE860F', false), '--color-background-orange': '#FE860F'},
      'variant:yellow': {...tile('#FBD530', false), '--color-background-yellow': '#FBD530'},
      'variant:purple': {...tile('#6B1D7B', true, '#6B1D7B'), '--color-background-purple': '#6B1D7B'},
      'variant:gray': {...tile(INK, true, INK), '--color-background-gray': `light-dark(${INK}, #261E33)`},
      'variant:teal': {...tile('#FFE1F1', false), '--color-background-teal': '#FFE1F1'},
      'variant:cyan': {...tile('#FFE6D3', false), '--color-background-cyan': '#FFE6D3'},
      'variant:blue': {...tile('#FFF1BF', false), '--color-background-blue': '#FFF1BF'},
      'variant:green': {...tile('#F1E1F6', false), '--color-background-green': '#F1E1F6'},
    },
  },
});
