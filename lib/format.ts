import { tStr, type Lang } from '@/lib/i18n';

export type Currency = 'UZS' | 'USD' | 'EUR' | 'GBP' | 'RUB';

type CurrencyMeta = {
  code: Currency;
  symbol: string;
  suffix?: string;
  flag: string;
  rate: number;
  decimals: 0 | 2;
};

// rate is 1 for every currency: amounts are stored as entered and the currency
// only changes the symbol/format (no conversion).
export const CURRENCIES: Record<Currency, CurrencyMeta> = {
  UZS: { code: 'UZS', symbol: '', suffix: "so'm", flag: '🇺🇿', rate: 1, decimals: 0 },
  USD: { code: 'USD', symbol: '$', flag: '🇺🇸', rate: 1, decimals: 2 },
  EUR: { code: 'EUR', symbol: '€', flag: '🇪🇺', rate: 1, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', flag: '🇬🇧', rate: 1, decimals: 2 },
  RUB: { code: 'RUB', symbol: '', suffix: '₽', flag: '🇷🇺', rate: 1, decimals: 0 },
};

export const CURRENCY_LIST: CurrencyMeta[] = [
  CURRENCIES.UZS,
  CURRENCIES.USD,
  CURRENCIES.EUR,
  CURRENCIES.GBP,
  CURRENCIES.RUB,
];

export const maskAmount = (formatted: string): string => formatted.replace(/\d/g, '*');

export const fmtMoney = (n: number, currency: Currency, hidden = false): string => {
  const c = CURRENCIES[currency];
  const v = n * c.rate;
  const abs = Math.abs(v);
  const num =
    c.decimals > 0
      ? abs.toFixed(c.decimals).replace(/\B(?=(\d{3})+(?=\.))/g, ' ')
      : Math.round(abs)
          .toString()
          .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  const sign = v < 0 ? '−' : '';
  const out = c.symbol ? sign + c.symbol + num : sign + num;
  return hidden ? maskAmount(out) : out;
};

export const unitOf = (currency: Currency): string => CURRENCIES[currency].suffix ?? '';

export const today = () => new Date();

export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const daysAgo = (n: number) => {
  const d = today();
  d.setDate(d.getDate() - n);
  return isoDate(d);
};

export const daysFromNow = (n: number) => {
  const d = today();
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const fmtDate = (iso: string, lang: Lang) => {
  if (!iso) return '';
  const d = new Date(iso);
  const t = today();
  const sameDay = (a: Date, b: Date) => isoDate(a) === isoDate(b);
  if (sameDay(d, t)) return tStr(lang, 'today');
  const yest = new Date(t);
  yest.setDate(t.getDate() - 1);
  if (sameDay(d, yest)) return tStr(lang, 'yesterday');
  return MONTHS[d.getMonth()] + ' ' + d.getDate();
};

export const monthKey = (iso: string) => iso.slice(0, 7);

export const last6Months = () => {
  const out: { key: string; label: string }[] = [];
  const d = today();
  for (let i = 5; i >= 0; i--) {
    const nd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, '0')}`;
    out.push({ key, label: MONTHS[nd.getMonth()] });
  }
  return out;
};
