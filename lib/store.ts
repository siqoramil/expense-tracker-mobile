import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { daysAgo, daysFromNow, isoDate, today, type Currency } from './format';
import { authApi, setApiToken, type UserDTO } from './api';
import { setAppLanguage, type Lang, type Localized } from './i18n';

const STORAGE_KEY = 'ledgr_state_v2';

export type TxKind = 'income' | 'expense';
export type DebtDirection = 'owe_me' | 'i_owe';

export type Category = {
  id: string;
  label: Localized;
  icon: string;
  color: string;
  kind: TxKind;
};

export type Wallet = {
  id: string;
  name: Localized;
  icon: string;
  color: string;
  balance: number;
};

export type Transaction = {
  id: string;
  kind: TxKind;
  cat: string;
  wallet: string;
  amount: number;
  note?: string;
  date: string;
};

export type Payment = { id: string; amount: number; date: string };

export type Debt = {
  id: string;
  direction: DebtDirection;
  name: string;
  color: string;
  amount: number;
  paid: number;
  due: string;
  note?: string;
  created: string;
  payments: Payment[];
  archived?: boolean;
};

export type Budget = { id: string; cat: string; limit: number };

export type Recurring = {
  id: string;
  kind: TxKind;
  cat: string;
  wallet: string;
  amount: number;
  note: string;
  every: 'month' | 'week';
  nextDate: string;
  enabled: boolean;
};

export type NotifKind = 'overdue' | 'budget' | 'bill' | 'income';

export type Notif = {
  id: string;
  kind: NotifKind;
  title: Localized;
  body: Localized;
  date: string;
  read: boolean;
};

export type Goal = {
  title: Localized;
  target: number;
  saved: number;
  deadline: string;
};

export type Prefs = {
  lang: Lang;
  currency: Currency;
  dark: boolean;
  pin: boolean;
  notifications: boolean;
  biometric: boolean;
};

export type State = {
  version: 2;
  onboarded: boolean;
  loggedIn: boolean;
  token: string | null;
  profile: { name: string; email: string; avatar: string; pro: boolean };
  prefs: Prefs;
  categories: Category[];
  wallets: Wallet[];
  tx: Transaction[];
  debts: Debt[];
  budgets: Budget[];
  recurring: Recurring[];
  notifs: Notif[];
  goal: Goal;
};

const SEED_CATEGORIES: Category[] = [
  { id: 'food', label: { en: 'Food', uz: 'Ovqat' }, icon: 'coffee', color: '#F59E0B', kind: 'expense' },
  { id: 'transport', label: { en: 'Transport', uz: 'Transport' }, icon: 'car', color: '#3B82F6', kind: 'expense' },
  { id: 'shopping', label: { en: 'Shopping', uz: 'Xarid' }, icon: 'cart', color: '#EC4899', kind: 'expense' },
  { id: 'rent', label: { en: 'Rent', uz: 'Ijara' }, icon: 'home-icon', color: '#8B5CF6', kind: 'expense' },
  { id: 'bills', label: { en: 'Bills', uz: 'Kommunal' }, icon: 'phone', color: '#06B6D4', kind: 'expense' },
  { id: 'salary', label: { en: 'Salary', uz: 'Maosh' }, icon: 'briefcase', color: '#10B981', kind: 'income' },
  { id: 'bonus', label: { en: 'Bonus', uz: 'Bonus' }, icon: 'gift', color: '#14B8A6', kind: 'income' },
];

const SEED_WALLETS: Wallet[] = [
  { id: 'cash', name: { en: 'Cash', uz: 'Naqd' }, icon: 'wallet', color: '#10B981', balance: 1_850_000 },
  { id: 'card', name: { en: 'Visa Card', uz: 'Visa Karta' }, icon: 'credit-card', color: '#6366F1', balance: 4_320_000 },
  { id: 'savings', name: { en: 'Savings', uz: 'Jamg‘arma' }, icon: 'lock', color: '#F59E0B', balance: 12_000_000 },
];

const SEED_TX = (): Transaction[] => [
  { id: 't1', kind: 'income', cat: 'salary', wallet: 'card', amount: 12000000, note: 'April salary', date: daysAgo(0) },
  { id: 't2', kind: 'expense', cat: 'food', wallet: 'cash', amount: 85000, note: 'Chaykhana Navat', date: daysAgo(0) },
  { id: 't3', kind: 'expense', cat: 'transport', wallet: 'card', amount: 35000, note: 'Yandex Go', date: daysAgo(0) },
  { id: 't4', kind: 'expense', cat: 'shopping', wallet: 'card', amount: 450000, note: 'Korzinka', date: daysAgo(1) },
  { id: 't5', kind: 'expense', cat: 'bills', wallet: 'card', amount: 220000, note: 'Internet', date: daysAgo(1) },
  { id: 't6', kind: 'income', cat: 'bonus', wallet: 'card', amount: 800000, note: 'Freelance', date: daysAgo(2) },
  { id: 't7', kind: 'expense', cat: 'food', wallet: 'cash', amount: 45000, note: 'Evos', date: daysAgo(3) },
  { id: 't8', kind: 'expense', cat: 'rent', wallet: 'card', amount: 3500000, note: 'April rent', date: daysAgo(14) },
  { id: 't9', kind: 'expense', cat: 'transport', wallet: 'card', amount: 1200000, note: 'Fuel + service', date: daysAgo(16) },
  { id: 't10', kind: 'expense', cat: 'food', wallet: 'cash', amount: 62000, note: 'Coffee shop', date: daysAgo(5) },
  { id: 't11', kind: 'expense', cat: 'shopping', wallet: 'card', amount: 320000, note: 'Clothes', date: daysAgo(7) },
  { id: 't12', kind: 'expense', cat: 'food', wallet: 'cash', amount: 28000, note: 'Samsa', date: daysAgo(2) },
];

const SEED_DEBTS = (): Debt[] => [
  { id: 'd1', direction: 'owe_me', name: 'Azizbek Karimov', color: '#6366F1', amount: 2500000, paid: 0, due: daysFromNow(7), note: 'Rent deposit', created: daysAgo(20), payments: [] },
  { id: 'd2', direction: 'owe_me', name: 'Dilnoza Rashidova', color: '#EC4899', amount: 750000, paid: 250000, due: daysFromNow(4), note: 'Birthday dinner', created: daysAgo(7), payments: [{ id: 'p1', amount: 250000, date: daysAgo(2) }] },
  { id: 'd3', direction: 'owe_me', name: 'Jasur Tursunov', color: '#10B981', amount: 1200000, paid: 0, due: daysFromNow(18), note: 'Car repair', created: daysAgo(11), payments: [] },
  { id: 'd4', direction: 'owe_me', name: 'Madina Yusupova', color: '#F59E0B', amount: 300000, paid: 0, due: daysAgo(3), note: 'Groceries', created: daysAgo(15), payments: [] },
  { id: 'd5', direction: 'i_owe', name: 'Uncle Bobur', color: '#8B5CF6', amount: 4000000, paid: 1000000, due: daysFromNow(30), note: 'Emergency loan', created: daysAgo(45), payments: [{ id: 'p2', amount: 1000000, date: daysAgo(10) }] },
  { id: 'd6', direction: 'i_owe', name: 'Shahnoza', color: '#06B6D4', amount: 500000, paid: 0, due: daysFromNow(14), note: 'Lunch tab', created: daysAgo(3), payments: [] },
];

const SEED_BUDGETS: Budget[] = [
  { id: 'b1', cat: 'food', limit: 1500000 },
  { id: 'b2', cat: 'transport', limit: 1500000 },
  { id: 'b3', cat: 'shopping', limit: 1000000 },
  { id: 'b4', cat: 'bills', limit: 500000 },
];

const SEED_RECURRING = (): Recurring[] => [
  { id: 'r1', kind: 'income', cat: 'salary', wallet: 'card', amount: 12000000, note: 'Monthly salary', every: 'month', nextDate: daysFromNow(13), enabled: true },
  { id: 'r2', kind: 'expense', cat: 'rent', wallet: 'card', amount: 3500000, note: 'Rent', every: 'month', nextDate: daysFromNow(17), enabled: true },
  { id: 'r3', kind: 'expense', cat: 'bills', wallet: 'card', amount: 220000, note: 'Internet', every: 'month', nextDate: daysFromNow(11), enabled: true },
];

const SEED_NOTIFS = (): Notif[] => [
  { id: 'n1', kind: 'overdue', title: { en: 'Madina’s debt is overdue', uz: 'Madina qarzi muddati o‘tdi' }, body: { en: '300 000 so‘m was due 3 days ago.', uz: '300 000 so‘m 3 kun oldin muddati tugagan.' }, date: daysAgo(0), read: false },
  { id: 'n2', kind: 'budget', title: { en: 'Transport budget 82%', uz: 'Transport byudjeti 82%' }, body: { en: 'You’ve used 1 235 000 of 1 500 000 so‘m.', uz: '1 500 000 so‘mdan 1 235 000 ishlatildi.' }, date: daysAgo(1), read: false },
  { id: 'n3', kind: 'bill', title: { en: 'Rent due soon', uz: 'Ijara to‘lovi yaqin' }, body: { en: 'Apartment rent — due in 17 days.', uz: 'Ijara to‘lovi — 17 kundan keyin.' }, date: daysAgo(2), read: true },
  { id: 'n4', kind: 'income', title: { en: 'Freelance income added', uz: 'Frilans daromad qo‘shildi' }, body: { en: '+800 000 so‘m to Visa Card.', uz: 'Visa Kartaga +800 000 so‘m.' }, date: daysAgo(2), read: true },
];

const SEED_GOAL = (): Goal => ({
  title: { en: 'New laptop', uz: 'Yangi noutbuk' },
  target: 15_000_000,
  saved: 6_200_000,
  deadline: daysFromNow(90),
});

const SEED = (): State => ({
  version: 2,
  onboarded: false,
  loggedIn: false,
  token: null,
  profile: { name: 'Sardor Akmalov', email: 'sardor.akmalov@gmail.com', avatar: 'SA', pro: true },
  prefs: {
    lang: 'en',
    currency: 'UZS',
    dark: false,
    pin: false,
    notifications: true,
    biometric: false,
  },
  categories: SEED_CATEGORIES,
  wallets: SEED_WALLETS,
  tx: SEED_TX(),
  debts: SEED_DEBTS(),
  budgets: SEED_BUDGETS,
  recurring: SEED_RECURRING(),
  notifs: SEED_NOTIFS(),
  goal: SEED_GOAL(),
});

let state: State = SEED();
let hydrated = false;
const listeners = new Set<(s: State) => void>();

const persist = async (s: State) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {}
};

export const hydrate = async () => {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 2) state = parsed;
    }
  } catch {}
  state = { ...state, onboarded: false };
  setAppLanguage(state.prefs.lang);
  if (state.token) setApiToken(state.token);
  hydrated = true;
  listeners.forEach((fn) => fn(state));
};

export const store = {
  get: () => state,
  set: (updater: Partial<State> | ((s: State) => State)) => {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    listeners.forEach((fn) => fn(state));
    void persist(state);
  },
  subscribe: (fn: (s: State) => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  reset: () => {
    state = SEED();
    listeners.forEach((fn) => fn(state));
    void persist(state);
  },
};

export function useStore(): State {
  const [s, setS] = useState(state);
  useEffect(() => store.subscribe(setS), []);
  return s;
}

const avatarFromName = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const isImageAvatar = (a: string) =>
  a.startsWith('data:image') || a.startsWith('http://') || a.startsWith('https://');

const applyUserDTO = (s: State, user: UserDTO): State => ({
  ...s,
  profile: {
    name: user.name,
    email: user.email,
    avatar: user.avatar || avatarFromName(user.name),
    pro: user.pro,
  },
});

export const actions = {
  completeOnboarding: () => store.set((s) => ({ ...s, onboarded: true })),
  login: () => store.set((s) => ({ ...s, loggedIn: true, onboarded: true })),
  logout: () => {
    setApiToken(null);
    store.set((s) => ({ ...s, loggedIn: false, token: null }));
  },

  setAuth: (token: string, user: UserDTO) => {
    setApiToken(token);
    store.set((s) => ({
      ...applyUserDTO(s, user),
      token,
      loggedIn: true,
      onboarded: true,
    }));
  },

  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    if (k === 'lang') setAppLanguage(v as Lang);
    store.set((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } }));
  },

  updateName: async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('empty_name');
    const prev = store.get().profile.avatar;
    const nextAvatar = isImageAvatar(prev) ? prev : avatarFromName(trimmed);
    store.set((s) => ({
      ...s,
      profile: { ...s.profile, name: trimmed, avatar: nextAvatar },
    }));
    if (store.get().token) {
      const { user } = await authApi.updateMe({ name: trimmed });
      store.set((s) => applyUserDTO(s, user));
    }
  },

  updateAvatar: async (avatar: string) => {
    store.set((s) => ({ ...s, profile: { ...s.profile, avatar } }));
    if (store.get().token) {
      const { user } = await authApi.updateMe({ avatar });
      store.set((s) => applyUserDTO(s, user));
    }
  },

  removeAvatar: async () => {
    const initials = avatarFromName(store.get().profile.name);
    store.set((s) => ({ ...s, profile: { ...s.profile, avatar: initials } }));
    if (store.get().token) {
      const { user } = await authApi.updateMe({ avatar: initials });
      store.set((s) => applyUserDTO(s, user));
    }
  },

  requestEmailChange: async (newEmail: string) => {
    await authApi.requestEmailChange({ newEmail: newEmail.trim().toLowerCase() });
  },

  verifyEmailChange: async (code: string) => {
    const { user } = await authApi.verifyEmailChange({ code });
    store.set((s) => applyUserDTO(s, user));
  },

  forgotPassword: async (email: string) => {
    await authApi.forgotPassword({ email: email.trim().toLowerCase() });
  },

  verifyResetCode: async (email: string, code: string) => {
    await authApi.verifyResetCode({ email: email.trim().toLowerCase(), code });
  },

  resetPassword: async (email: string, code: string, newPassword: string) => {
    await authApi.resetPassword({
      email: email.trim().toLowerCase(),
      code,
      newPassword,
    });
  },

  addTx: (tx: Omit<Transaction, 'id'>) =>
    store.set((s) => {
      const id = 't' + Date.now();
      const newTx: Transaction = { id, ...tx };
      const wallets = s.wallets.map((w) => {
        if (w.id !== tx.wallet) return w;
        const delta = tx.kind === 'income' ? tx.amount : -tx.amount;
        return { ...w, balance: w.balance + delta };
      });
      return { ...s, tx: [newTx, ...s.tx], wallets };
    }),
  updateTx: (id: string, patch: Partial<Transaction>) =>
    store.set((s) => {
      const old = s.tx.find((x) => x.id === id);
      if (!old) return s;
      const next: Transaction = { ...old, ...patch };
      const wallets = s.wallets.map((w) => {
        let bal = w.balance;
        if (w.id === old.wallet) bal -= old.kind === 'income' ? old.amount : -old.amount;
        if (w.id === next.wallet) bal += next.kind === 'income' ? next.amount : -next.amount;
        return { ...w, balance: bal };
      });
      return { ...s, tx: s.tx.map((x) => (x.id === id ? next : x)), wallets };
    }),
  deleteTx: (id: string) =>
    store.set((s) => {
      const old = s.tx.find((x) => x.id === id);
      if (!old) return s;
      const wallets = s.wallets.map((w) => {
        if (w.id !== old.wallet) return w;
        const delta = old.kind === 'income' ? -old.amount : old.amount;
        return { ...w, balance: w.balance + delta };
      });
      return { ...s, tx: s.tx.filter((x) => x.id !== id), wallets };
    }),

  addDebt: (d: Partial<Debt> & Pick<Debt, 'name' | 'direction' | 'amount' | 'due' | 'color'>) =>
    store.set((s) => ({
      ...s,
      debts: [
        {
          id: 'd' + Date.now(),
          paid: 0,
          payments: [],
          created: isoDate(today()),
          note: '',
          ...d,
        } as Debt,
        ...s.debts,
      ],
    })),
  updateDebt: (id: string, patch: Partial<Debt>) =>
    store.set((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) })),
  deleteDebt: (id: string) =>
    store.set((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) })),
  addPayment: (debtId: string, amount: number) =>
    store.set((s) => ({
      ...s,
      debts: s.debts.map((d) =>
        d.id === debtId
          ? {
              ...d,
              paid: d.paid + amount,
              payments: [...d.payments, { id: 'p' + Date.now(), amount, date: isoDate(today()) }],
            }
          : d,
      ),
    })),
  archiveDebt: (id: string) =>
    store.set((s) => ({
      ...s,
      debts: s.debts.map((d) => (d.id === id ? { ...d, archived: true, paid: d.amount } : d)),
    })),

  addCategory: (c: Omit<Category, 'id'>) =>
    store.set((s) => ({ ...s, categories: [...s.categories, { id: 'c' + Date.now(), ...c }] })),
  deleteCategory: (id: string) =>
    store.set((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) })),

  addBudget: (b: Omit<Budget, 'id'>) =>
    store.set((s) => ({ ...s, budgets: [...s.budgets, { id: 'b' + Date.now(), ...b }] })),
  deleteBudget: (id: string) =>
    store.set((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) })),

  updateRecurring: (id: string, patch: Partial<Recurring>) =>
    store.set((s) => ({
      ...s,
      recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    })),

  markNotifRead: (id: string) =>
    store.set((s) => ({
      ...s,
      notifs: s.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotifsRead: () =>
    store.set((s) => ({ ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) })),
};

export const selectMonth = (s: State, month: string) => {
  const tx = s.tx.filter((x) => x.date.startsWith(month));
  const income = tx.filter((x) => x.kind === 'income').reduce((a, x) => a + x.amount, 0);
  const expense = tx.filter((x) => x.kind === 'expense').reduce((a, x) => a + x.amount, 0);
  return { tx, income, expense, net: income - expense };
};

export const catLabel = (cat: Category | undefined, lang: Lang) =>
  cat?.label?.[lang] || cat?.label?.en || cat?.id || '';
export const walletName = (w: Wallet | undefined, lang: Lang) =>
  w?.name?.[lang] || w?.name?.en || w?.id || '';
