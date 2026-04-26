// Design tokens — Clean & minimal, indigo accent
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "dark": false
}/*EDITMODE-END*/;

const makeTokens = (dark) => dark ? {
  // dark
  bg: '#0B0B0F',
  surface: '#151519',
  surfaceElev: '#1E1E24',
  surfaceAlt: '#222228',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#FAFAFA',
  textSec: 'rgba(235,235,245,0.6)',
  textTer: 'rgba(235,235,245,0.38)',
  accent: '#6366F1',
  accentSoft: 'rgba(99,102,241,0.16)',
  income: '#10B981',
  incomeSoft: 'rgba(16,185,129,0.16)',
  expense: '#EF4444',
  expenseSoft: 'rgba(239,68,68,0.16)',
  tabBg: 'rgba(21,21,25,0.85)',
  tabBorder: 'rgba(255,255,255,0.06)',
  sheetBg: '#17171B',
  divider: 'rgba(255,255,255,0.06)',
} : {
  // light
  bg: '#F4F4F5',
  surface: '#FFFFFF',
  surfaceElev: '#FFFFFF',
  surfaceAlt: '#FAFAFA',
  border: 'rgba(0,0,0,0.06)',
  borderStrong: 'rgba(0,0,0,0.1)',
  text: '#0A0A0A',
  textSec: '#71717A',
  textTer: '#A1A1AA',
  accent: '#4F46E5',
  accentSoft: 'rgba(79,70,229,0.08)',
  income: '#059669',
  incomeSoft: 'rgba(5,150,105,0.08)',
  expense: '#DC2626',
  expenseSoft: 'rgba(220,38,38,0.08)',
  tabBg: 'rgba(255,255,255,0.82)',
  tabBorder: 'rgba(0,0,0,0.05)',
  sheetBg: '#FFFFFF',
  divider: 'rgba(0,0,0,0.06)',
};

// Format UZS: 2 450 000 so'm
const fmtUZS = (n) => {
  const s = Math.abs(Math.round(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (n < 0 ? '−' : '') + s;
};
const fmtUZSwithUnit = (n) => fmtUZS(n) + ' so\'m';

window.makeTokens = makeTokens;
window.fmtUZS = fmtUZS;
window.fmtUZSwithUnit = fmtUZSwithUnit;
window.TWEAK_DEFAULTS = TWEAK_DEFAULTS;
