import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { authApi, setApiToken, setUnauthorizedHandler, type UserDTO } from '@/lib/api';
import { bootstrapSync, push } from '@/lib/sync';
import { idmap } from '@/lib/sync/idmap';
import { isoDate, today, type Currency } from '@/lib/format';
import { setAppLanguage, type Lang, type Localized } from '@/lib/i18n';

const STORAGE_KEY = 'expense_tracker_state_v2';
// JWT lives in SecureStore (Keychain on iOS, EncryptedSharedPreferences on
// Android) — AsyncStorage is plaintext in the app sandbox and survives
// adb backup / rooted-device extraction. Everything else (UI state,
// transactions cache) stays in AsyncStorage; the server is the source of
// truth and refetches on login.
const TOKEN_KEY = 'expense_tracker_token';

export type TxKind = 'income' | 'expense';
export type CategoryKind = TxKind | 'subscription';
export type DebtDirection = 'owe_me' | 'i_owe';

export type Category = {
  id: string;
  label: Localized;
  icon: string;
  color: string;
  kind: CategoryKind;
  hidden?: boolean;
};

export type Wallet = {
  id: string;
  name: Localized;
  icon: string;
  color: string;
  balance: number;
  hidden?: boolean;
};

export type Transaction = {
  id: string;
  kind: TxKind;
  cat: string;
  wallet: string;
  amount: number;
  note?: string;
  date: string;
  time?: string;
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
  dueTime?: string;
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
  // Persisted-schema version; bumped on shape changes so hydrate() can migrate.
  version: number;
  onboarded: boolean;
  loggedIn: boolean;
  token: string | null;
  // Local privacy toggle. Banking-app style: when true, every money amount
  // across the app is masked. Persisted locally, not synced to the server —
  // it's a UX preference, not an account setting.
  hideBalance: boolean;
  profile: {
    name: string;
    email: string;
    avatar: string;
    pro: boolean;
    hasPassword: boolean;
    hasGoogle: boolean;
  };
  prefs: Prefs;
  categories: Category[];
  wallets: Wallet[];
  tx: Transaction[];
  debts: Debt[];
  budgets: Budget[];
  recurring: Recurring[];
  notifs: Notif[];
  goal: Goal | null;
};

const SEED_CATEGORIES: Category[] = [
  {
    id: 'food',
    label: { en: 'Food', uz: 'Ovqat' },
    icon: 'coffee',
    color: '#F59E0B',
    kind: 'expense',
  },
  {
    id: 'transport',
    label: { en: 'Transport', uz: 'Transport' },
    icon: 'car',
    color: '#3B82F6',
    kind: 'expense',
  },
  {
    id: 'shopping',
    label: { en: 'Shopping', uz: 'Xarid' },
    icon: 'cart',
    color: '#EC4899',
    kind: 'expense',
  },
  {
    id: 'rent',
    label: { en: 'Rent', uz: 'Ijara' },
    icon: 'home-icon',
    color: '#8B5CF6',
    kind: 'expense',
  },
  {
    id: 'bills',
    label: { en: 'Bills', uz: 'Kommunal' },
    icon: 'phone',
    color: '#06B6D4',
    kind: 'expense',
  },
  {
    id: 'salary',
    label: { en: 'Salary', uz: 'Maosh' },
    icon: 'briefcase',
    color: '#10B981',
    kind: 'income',
  },
  {
    id: 'bonus',
    label: { en: 'Bonus', uz: 'Bonus' },
    icon: 'gift',
    color: '#14B8A6',
    kind: 'income',
  },
  {
    id: 'sub_streaming',
    label: { en: 'Streaming', uz: 'Streaming' },
    icon: 'tag',
    color: '#EF4444',
    kind: 'subscription',
  },
  {
    id: 'sub_internet',
    label: { en: 'Internet', uz: 'Internet' },
    icon: 'globe',
    color: '#06B6D4',
    kind: 'subscription',
  },
  {
    id: 'sub_gym',
    label: { en: 'Gym', uz: 'Sport zali' },
    icon: 'trending-up',
    color: '#F59E0B',
    kind: 'subscription',
  },
  {
    id: 'sub_software',
    label: { en: 'Software', uz: 'Dasturlar' },
    icon: 'lock',
    color: '#8B5CF6',
    kind: 'subscription',
  },
];

// Default wallets so the app is always usable (every transaction needs one).
// Seeded only when the user has zero wallets. Lazily synced to the server on
// first use, like seed categories.
const SEED_WALLETS: Wallet[] = [
  { id: 'w_cash', name: { en: 'Cash', uz: 'Naqd' }, icon: 'wallet', color: '#10B981', balance: 0 },
  { id: 'w_card', name: { en: 'Card', uz: 'Karta' }, icon: 'credit-card', color: '#6366F1', balance: 0 },
];

// Fresh install state: default categories only, everything else empty so the
// user starts with a clean slate. Bump `version` whenever this shape changes —
// hydrate() migrates older persisted states (see the version check there).
const SEED = (): State => ({
  version: 3,
  onboarded: false,
  loggedIn: false,
  token: null,
  hideBalance: false,
  profile: {
    name: '',
    email: '',
    avatar: '',
    pro: false,
    hasPassword: false,
    hasGoogle: false,
  },
  prefs: {
    lang: 'en',
    currency: 'USD',
    dark: false,
    pin: false,
    notifications: true,
    biometric: false,
  },
  categories: SEED_CATEGORIES,
  wallets: [],
  tx: [],
  debts: [],
  budgets: [],
  recurring: [],
  notifs: [],
  goal: null,
});

let state: State = SEED();
let hydrated = false;
const listeners = new Set<(s: State) => void>();

const persist = async (s: State) => {
  try {
    // Persist everything EXCEPT the token to AsyncStorage. The token rides
    // in SecureStore (see persistToken).
    const { token: _t, ...rest } = s;
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
  } catch {}
};

// WHEN_UNLOCKED_THIS_DEVICE_ONLY scopes the JWT to this physical
// device — it never rides into an iCloud Keychain backup, so an
// attacker who compromises the user's iCloud password can't extract
// the token. The trade-off is that a fresh device install must
// re-authenticate, which is the right default for a finance app.
const SECURE_STORE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

const persistToken = async (token: string | null): Promise<void> => {
  try {
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token, SECURE_STORE_OPTS);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
};

export const hydrate = async () => {
  if (hydrated) return;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed.version === 3) {
        state = { ...parsed, token: null };
      } else if (parsed.version === 2) {
        // Migrate demo-seed installs (v2 shipped with bundled fake data) to an
        // empty slate: drop the seeded financial records, keep the user's prefs,
        // profile, and any categories. Default categories are re-added below.
        state = {
          ...parsed,
          version: 3,
          token: null,
          wallets: [],
          tx: [],
          debts: [],
          budgets: [],
          recurring: [],
          notifs: [],
          goal: null,
        };
      }
    }
  } catch {}

  // One-shot migration: older builds wrote { token } into AsyncStorage.
  // Move any leftover token into SecureStore and clear the plaintext copy.
  let token: string | null = null;
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State> & { token?: string | null };
      if (typeof parsed.token === 'string' && parsed.token.length > 0) {
        token = parsed.token;
        await SecureStore.setItemAsync(TOKEN_KEY, token, SECURE_STORE_OPTS);
        const { token: _t, ...rest } = parsed as State;
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(rest));
      }
    }
  } catch {}
  if (!token) {
    try {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {}
  }
  state = { ...state, token, loggedIn: state.loggedIn && Boolean(token) };

  const haveIds = new Set(state.categories.map((c) => c.id));
  const missingSeeds = SEED_CATEGORIES.filter((c) => !haveIds.has(c.id));
  if (missingSeeds.length > 0) {
    state = { ...state, categories: [...state.categories, ...missingSeeds] };
  }
  // Seed default wallets only for offline/not-logged-in users. When a token
  // is present the server is authoritative: bootstrapSync will populate
  // wallets from GET /wallets (which seeds Cash+Card server-side on first
  // call). Seeding locally for a logged-in user would cause divergence across
  // devices if the server already has different wallet ids.
  if (state.wallets.length === 0 && !token) {
    state = { ...state, wallets: SEED_WALLETS };
  }
  // Uzbek language was removed (so'm currency stays available) — migrate anyone
  // still on the Uzbek UI language to English.
  if (state.prefs.lang === 'uz') {
    state = { ...state, prefs: { ...state.prefs, lang: 'en' } };
  }
  if (!['UZS', 'USD', 'EUR', 'GBP', 'RUB'].includes(state.prefs.currency as string)) {
    state = { ...state, prefs: { ...state.prefs, currency: 'USD' } };
  }
  setAppLanguage(state.prefs.lang);
  if (state.token) setApiToken(state.token);
  // Bounce the user out as soon as the server reports the token is no
  // longer valid (revoked, expired, or the user was deleted). Clear
  // SecureStore BEFORE flipping in-memory state — that way the on-disk
  // token can't outlive the logout even if the user kills the app a
  // millisecond later.
  setUnauthorizedHandler(async () => {
    setApiToken(null);
    await persistToken(null);
    store.set((s) => ({ ...s, loggedIn: false, token: null }));
  });
  hydrated = true;
  listeners.forEach((fn) => fn(state));
  if (state.token) void bootstrapSync();
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
  reset: async () => {
    state = SEED();
    listeners.forEach((fn) => fn(state));
    // Persist cleared state to AsyncStorage first so no ghost data remains,
    // then clear the token from SecureStore. Reversing the order would leave
    // a window where the token is already gone but the old state is still on
    // disk, which is safe but inconsistent; this order guarantees that after
    // reset() resolves the disk holds neither sensitive state nor a stale token.
    await persist(state);
    await Promise.all([persistToken(null), idmap.clear()]);
  },
};

export function useStore(): State {
  const [s, setS] = useState(state);
  useEffect(() => store.subscribe(setS), []);
  return s;
}

export function useStoreSelector<T>(
  selector: (s: State) => T,
  isEqual?: (a: T, b: T) => boolean,
): T {
  const selectorRef = useRef(selector);
  selectorRef.current = selector;
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  // Cache the last derived value so the getSnapshot function can return the
  // same reference when the selected slice has not changed, preventing
  // useSyncExternalStore from scheduling a re-render.
  const lastRef = useRef<{ input: State; output: T } | null>(null);

  const getSnapshot = (): T => {
    const s = store.get();
    if (lastRef.current !== null && lastRef.current.input === s) {
      return lastRef.current.output;
    }
    const next = selectorRef.current(s);
    if (
      lastRef.current !== null &&
      (isEqualRef.current
        ? isEqualRef.current(lastRef.current.output, next)
        : Object.is(lastRef.current.output, next))
    ) {
      // Return the previous output so the reference stays stable and
      // useSyncExternalStore sees no change.
      lastRef.current = { input: s, output: lastRef.current.output };
      return lastRef.current.output;
    }
    lastRef.current = { input: s, output: next };
    return next;
  };

  return useSyncExternalStore(store.subscribe, getSnapshot, getSnapshot);
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
    // Older servers may omit these flags; treat undefined as false so the
    // mobile app degrades to "no password / no google" assumptions cleanly.
    hasPassword: Boolean(user.hasPassword),
    hasGoogle: Boolean(user.hasGoogle),
  },
});

export const actions = {
  completeOnboarding: () => store.set((s) => ({ ...s, onboarded: true })),
  login: () => store.set((s) => ({ ...s, loggedIn: true, onboarded: true })),
  // Sensitive transitions (logout / setAuth / confirmAccountDelete) are
  // async because they touch SecureStore. Callers MUST await, otherwise
  // the JS engine can be killed (force-quit, low-memory eviction) before
  // the keychain write/delete settles — leaving an authenticated token
  // on disk after a user-initiated logout, or a half-written token
  // after sign-in.
  logout: async (): Promise<void> => {
    setApiToken(null);
    await persistToken(null);
    await idmap.clear();
    store.set((s) => ({ ...s, loggedIn: false, token: null }));
  },

  requestAccountDelete: async () => {
    await authApi.requestAccountDelete();
  },

  confirmAccountDelete: async (code: string, reauth: { password?: string; idToken?: string }) => {
    await authApi.confirmAccountDelete({ code, ...reauth });
    setApiToken(null);
    // store.reset() awaits persistToken(null) internally — chain it so
    // callers waiting on confirmAccountDelete don't return until disk
    // is clean.
    await store.reset();
  },

  setAuth: async (token: string, user: UserDTO): Promise<void> => {
    setApiToken(token);
    await persistToken(token);
    store.set((s) => ({
      ...applyUserDTO(s, user),
      token,
      loggedIn: true,
      onboarded: true,
    }));
    void bootstrapSync();
  },

  setPref: <K extends keyof Prefs>(k: K, v: Prefs[K]) => {
    if (k === 'lang') setAppLanguage(v as Lang);
    store.set((s) => ({ ...s, prefs: { ...s.prefs, [k]: v } }));
  },

  toggleHideBalance: () => {
    store.set((s) => ({ ...s, hideBalance: !s.hideBalance }));
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

  verifyResetCode: async (email: string, code: string): Promise<string> => {
    const { verifiedToken } = await authApi.verifyResetCode({ email: email.trim().toLowerCase(), code });
    return verifiedToken;
  },

  resetPassword: async (email: string, code: string, newPassword: string, verifiedToken: string) => {
    await authApi.resetPassword({
      email: email.trim().toLowerCase(),
      code,
      newPassword,
      verifiedToken,
    });
  },

  // Attach a Google identity to the currently signed-in account. The
  // server requires that the Google email matches the account email,
  // closing the auto-link takeover gap that /auth/google used to leave open.
  linkGoogle: async (idToken: string) => {
    const { user } = await authApi.linkGoogle({ idToken });
    store.set((s) => applyUserDTO(s, user));
  },

  addTx: (tx: Omit<Transaction, 'id'>) => {
    const id = 't' + Date.now();
    const newTx: Transaction = { id, ...tx };
    store.set((s) => {
      const wallets = s.wallets.map((w) => {
        if (w.id !== tx.wallet) return w;
        const delta = tx.kind === 'income' ? tx.amount : -tx.amount;
        return { ...w, balance: w.balance + delta };
      });
      return { ...s, tx: [newTx, ...s.tx], wallets };
    });
    void push.tx.create(newTx, () => {
      store.set((s) => {
        const old = s.tx.find((x) => x.id === id);
        if (!old) return s;
        const wallets = s.wallets.map((w) => {
          if (w.id !== old.wallet) return w;
          const delta = old.kind === 'income' ? -old.amount : old.amount;
          return { ...w, balance: w.balance + delta };
        });
        return { ...s, tx: s.tx.filter((x) => x.id !== id), wallets };
      });
    });
  },
  updateTx: (id: string, patch: Partial<Transaction>) => {
    const s = store.get();
    const old = s.tx.find((x) => x.id === id);
    if (!old) return;
    const next: Transaction = { ...old, ...patch };
    store.set((cur) => {
      const wallets = cur.wallets.map((w) => {
        let bal = w.balance;
        if (w.id === old.wallet) bal -= old.kind === 'income' ? old.amount : -old.amount;
        if (w.id === next.wallet) bal += next.kind === 'income' ? next.amount : -next.amount;
        return { ...w, balance: bal };
      });
      return { ...cur, tx: cur.tx.map((x) => (x.id === id ? next : x)), wallets };
    });
    void push.tx.update(id, patch, () => {
      store.set((cur) => {
        const wallets = cur.wallets.map((w) => {
          let bal = w.balance;
          if (w.id === next.wallet) bal -= next.kind === 'income' ? next.amount : -next.amount;
          if (w.id === old.wallet) bal += old.kind === 'income' ? old.amount : -old.amount;
          return { ...w, balance: bal };
        });
        return { ...cur, tx: cur.tx.map((x) => (x.id === id ? old : x)), wallets };
      });
    });
  },
  deleteTx: (id: string) => {
    const s = store.get();
    const old = s.tx.find((x) => x.id === id);
    if (!old) return;
    store.set((cur) => {
      const wallets = cur.wallets.map((w) => {
        if (w.id !== old.wallet) return w;
        const delta = old.kind === 'income' ? -old.amount : old.amount;
        return { ...w, balance: w.balance + delta };
      });
      return { ...cur, tx: cur.tx.filter((x) => x.id !== id), wallets };
    });
    void push.tx.remove(id, () => {
      store.set((cur) => {
        const wallets = cur.wallets.map((w) => {
          if (w.id !== old.wallet) return w;
          const delta = old.kind === 'income' ? old.amount : -old.amount;
          return { ...w, balance: w.balance + delta };
        });
        return { ...cur, tx: [old, ...cur.tx], wallets };
      });
    });
  },

  addDebt: (d: Partial<Debt> & Pick<Debt, 'name' | 'direction' | 'amount' | 'due' | 'color'>) => {
    const newDebt: Debt = {
      id: 'd' + Date.now(),
      paid: 0,
      payments: [],
      created: isoDate(today()),
      note: '',
      ...d,
    };
    store.set((s) => ({ ...s, debts: [newDebt, ...s.debts] }));
    void push.debts.create(newDebt, () => {
      store.set((s) => ({ ...s, debts: s.debts.filter((x) => x.id !== newDebt.id) }));
    });
  },
  updateDebt: (id: string, patch: Partial<Debt>) => {
    const old = store.get().debts.find((d) => d.id === id);
    if (!old) return;
    store.set((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? { ...d, ...patch } : d)) }));
    void push.debts.update(id, patch, () => {
      store.set((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? old : d)) }));
    });
  },
  deleteDebt: (id: string) => {
    const old = store.get().debts.find((d) => d.id === id);
    if (!old) return;
    store.set((s) => ({ ...s, debts: s.debts.filter((d) => d.id !== id) }));
    void push.debts.remove(id, () => {
      store.set((s) => ({ ...s, debts: [old, ...s.debts] }));
    });
  },
  addPayment: (debtId: string, amount: number) => {
    const paymentDate = isoDate(today());
    const old = store.get().debts.find((d) => d.id === debtId);
    if (!old) return;
    store.set((s) => ({
      ...s,
      debts: s.debts.map((d) =>
        d.id === debtId
          ? {
              ...d,
              paid: d.paid + amount,
              payments: [...d.payments, { id: 'p' + Date.now(), amount, date: paymentDate }],
            }
          : d,
      ),
    }));
    void push.debts.addPayment(debtId, amount, paymentDate, () => {
      store.set((s) => ({ ...s, debts: s.debts.map((d) => (d.id === debtId ? old : d)) }));
    });
  },
  archiveDebt: (id: string) => {
    const old = store.get().debts.find((d) => d.id === id);
    if (!old) return;
    store.set((s) => ({
      ...s,
      debts: s.debts.map((d) => (d.id === id ? { ...d, archived: true, paid: d.amount } : d)),
    }));
    void push.debts.archive(id, () => {
      store.set((s) => ({ ...s, debts: s.debts.map((d) => (d.id === id ? old : d)) }));
    });
  },

  addCategory: (c: Omit<Category, 'id'>) => {
    const newCat: Category = { id: 'c' + Date.now(), ...c };
    store.set((s) => ({ ...s, categories: [...s.categories, newCat] }));
    void push.categories.create(newCat, () => {
      store.set((s) => ({ ...s, categories: s.categories.filter((x) => x.id !== newCat.id) }));
    });
  },
  deleteCategory: (id: string) => {
    const old = store.get().categories.find((c) => c.id === id);
    if (!old) return;
    store.set((s) => ({ ...s, categories: s.categories.filter((c) => c.id !== id) }));
    void push.categories.remove(id, () => {
      store.set((s) => ({ ...s, categories: [...s.categories, old] }));
    });
  },
  setCategoryHidden: (id: string, hidden: boolean) =>
    store.set((s) => ({
      ...s,
      categories: s.categories.map((c) => (c.id === id ? { ...c, hidden } : c)),
    })),
  setWalletHidden: (id: string, hidden: boolean) =>
    store.set((s) => ({
      ...s,
      wallets: s.wallets.map((w) => (w.id === id ? { ...w, hidden } : w)),
    })),

  addWallet: (w: Omit<Wallet, 'id'>) => {
    const id = 'w' + Date.now();
    const newWallet: Wallet = { id, ...w };
    store.set((s) => ({ ...s, wallets: [newWallet, ...s.wallets] }));
    void push.wallets.create(newWallet, () => {
      store.set((s) => ({ ...s, wallets: s.wallets.filter((x) => x.id !== id) }));
    });
  },
  updateWallet: (id: string, patch: Partial<Wallet>) => {
    const old = store.get().wallets.find((w) => w.id === id);
    if (!old) return;
    store.set((s) => ({ ...s, wallets: s.wallets.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
    void push.wallets.update(id, patch, () => {
      store.set((s) => ({ ...s, wallets: s.wallets.map((w) => (w.id === id ? old : w)) }));
    });
  },
  deleteWallet: (id: string) => {
    const old = store.get().wallets.find((w) => w.id === id);
    if (!old) return;
    store.set((s) => ({ ...s, wallets: s.wallets.filter((w) => w.id !== id) }));
    void push.wallets.remove(id, () => {
      store.set((s) => ({ ...s, wallets: [old, ...s.wallets] }));
    });
  },

  addBudget: (b: Omit<Budget, 'id'>) => {
    const newBudget: Budget = { id: 'b' + Date.now(), ...b };
    store.set((s) => ({ ...s, budgets: [...s.budgets, newBudget] }));
    void push.budgets.create(newBudget, () => {
      store.set((s) => ({ ...s, budgets: s.budgets.filter((x) => x.id !== newBudget.id) }));
    });
  },
  deleteBudget: (id: string) => {
    const old = store.get().budgets.find((b) => b.id === id);
    if (!old) return;
    store.set((s) => ({ ...s, budgets: s.budgets.filter((b) => b.id !== id) }));
    void push.budgets.remove(id, () => {
      store.set((s) => ({ ...s, budgets: [...s.budgets, old] }));
    });
  },

  updateRecurring: (id: string, patch: Partial<Recurring>) => {
    const old = store.get().recurring.find((r) => r.id === id);
    if (!old) return;
    store.set((s) => ({
      ...s,
      recurring: s.recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
    void push.recurring.update(id, patch, () => {
      store.set((s) => ({
        ...s,
        recurring: s.recurring.map((r) => (r.id === id ? old : r)),
      }));
    });
  },

  markNotifRead: (id: string) => {
    const old = store.get().notifs.find((n) => n.id === id);
    if (!old) return;
    store.set((s) => ({
      ...s,
      notifs: s.notifs.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
    void push.notifs.markRead(id, () => {
      store.set((s) => ({
        ...s,
        notifs: s.notifs.map((n) => (n.id === id ? old : n)),
      }));
    });
  },
  markAllNotifsRead: () => {
    const oldNotifs = store.get().notifs;
    store.set((s) => ({ ...s, notifs: s.notifs.map((n) => ({ ...n, read: true })) }));
    void push.notifs.markAllRead(() => {
      store.set((s) => ({ ...s, notifs: oldNotifs }));
    });
  },
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
