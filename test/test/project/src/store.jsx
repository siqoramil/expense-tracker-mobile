// Global store — localStorage-persisted state + i18n + currency + seed
// All app state flows through here. Emits 'change' to re-render via useStore().

const STORAGE_KEY = 'ledgr_state_v2';

// ── Categories (seed) ──────────────────────────────
const SEED_CATEGORIES = [
  { id: 'food',      label: { en: 'Food',       uz: 'Ovqat' },        icon: 'coffee',     color: '#F59E0B', kind: 'expense' },
  { id: 'transport', label: { en: 'Transport',  uz: 'Transport' },    icon: 'car',        color: '#3B82F6', kind: 'expense' },
  { id: 'shopping',  label: { en: 'Shopping',   uz: 'Xarid' },        icon: 'cart',       color: '#EC4899', kind: 'expense' },
  { id: 'rent',      label: { en: 'Rent',       uz: 'Ijara' },        icon: 'home-icon',  color: '#8B5CF6', kind: 'expense' },
  { id: 'bills',     label: { en: 'Bills',      uz: 'Kommunal' },     icon: 'phone',      color: '#06B6D4', kind: 'expense' },
  { id: 'salary',    label: { en: 'Salary',     uz: 'Maosh' },        icon: 'briefcase',  color: '#10B981', kind: 'income'  },
  { id: 'bonus',     label: { en: 'Bonus',      uz: 'Bonus' },        icon: 'gift',       color: '#14B8A6', kind: 'income'  },
];

const SEED_WALLETS = [
  { id: 'cash',    name: { en: 'Cash',       uz: 'Naqd' },         icon: 'wallet',      color: '#10B981', balance: 1_850_000 },
  { id: 'card',    name: { en: 'Visa Card',  uz: 'Visa Karta' },   icon: 'credit-card', color: '#6366F1', balance: 4_320_000 },
  { id: 'savings', name: { en: 'Savings',    uz: 'Jamg\u2018arma' }, icon: 'lock',      color: '#F59E0B', balance: 12_000_000 },
];

const today = () => {
  const d = new Date(2026, 3, 17); // fixed "today" for demo reproducibility
  return d;
};
const isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const daysAgo = (n) => { const d = today(); d.setDate(d.getDate() - n); return isoDate(d); };
const daysFromNow = (n) => { const d = today(); d.setDate(d.getDate() + n); return isoDate(d); };

const SEED_TX = [
  { id: 't1',  kind: 'income',  cat: 'salary',    wallet: 'card', amount: 12000000, note: 'April salary',        date: daysAgo(0) },
  { id: 't2',  kind: 'expense', cat: 'food',      wallet: 'cash', amount: 85000,    note: 'Chaykhana Navat',     date: daysAgo(0) },
  { id: 't3',  kind: 'expense', cat: 'transport', wallet: 'card', amount: 35000,    note: 'Yandex Go',           date: daysAgo(0) },
  { id: 't4',  kind: 'expense', cat: 'shopping',  wallet: 'card', amount: 450000,   note: 'Korzinka',            date: daysAgo(1) },
  { id: 't5',  kind: 'expense', cat: 'bills',     wallet: 'card', amount: 220000,   note: 'Internet',            date: daysAgo(1) },
  { id: 't6',  kind: 'income',  cat: 'bonus',     wallet: 'card', amount: 800000,   note: 'Freelance',           date: daysAgo(2) },
  { id: 't7',  kind: 'expense', cat: 'food',      wallet: 'cash', amount: 45000,    note: 'Evos',                date: daysAgo(3) },
  { id: 't8',  kind: 'expense', cat: 'rent',      wallet: 'card', amount: 3500000,  note: 'April rent',          date: daysAgo(14) },
  { id: 't9',  kind: 'expense', cat: 'transport', wallet: 'card', amount: 1200000,  note: 'Fuel + service',      date: daysAgo(16) },
  { id: 't10', kind: 'expense', cat: 'food',      wallet: 'cash', amount: 62000,    note: 'Coffee shop',         date: daysAgo(5) },
  { id: 't11', kind: 'expense', cat: 'shopping',  wallet: 'card', amount: 320000,   note: 'Clothes',             date: daysAgo(7) },
  { id: 't12', kind: 'expense', cat: 'food',      wallet: 'cash', amount: 28000,    note: 'Samsa',               date: daysAgo(2) },
];

const SEED_DEBTS = [
  // direction: 'owe_me' (they owe me) or 'i_owe' (I owe them)
  { id: 'd1', direction: 'owe_me', name: 'Azizbek Karimov',   color: '#6366F1', amount: 2500000, paid: 0,       due: daysFromNow(7),   note: 'Rent deposit',     created: daysAgo(20), payments: [] },
  { id: 'd2', direction: 'owe_me', name: 'Dilnoza Rashidova', color: '#EC4899', amount: 750000,  paid: 250000,  due: daysFromNow(4),   note: 'Birthday dinner',  created: daysAgo(7),  payments: [{ id: 'p1', amount: 250000, date: daysAgo(2) }] },
  { id: 'd3', direction: 'owe_me', name: 'Jasur Tursunov',    color: '#10B981', amount: 1200000, paid: 0,       due: daysFromNow(18),  note: 'Car repair',       created: daysAgo(11), payments: [] },
  { id: 'd4', direction: 'owe_me', name: 'Madina Yusupova',   color: '#F59E0B', amount: 300000,  paid: 0,       due: daysAgo(3),       note: 'Groceries',        created: daysAgo(15), payments: [] },
  { id: 'd5', direction: 'i_owe',  name: 'Uncle Bobur',       color: '#8B5CF6', amount: 4000000, paid: 1000000, due: daysFromNow(30),  note: 'Emergency loan',   created: daysAgo(45), payments: [{ id: 'p2', amount: 1000000, date: daysAgo(10) }] },
  { id: 'd6', direction: 'i_owe',  name: 'Shahnoza',          color: '#06B6D4', amount: 500000,  paid: 0,       due: daysFromNow(14),  note: 'Lunch tab',        created: daysAgo(3),  payments: [] },
];

const SEED_BUDGETS = [
  { id: 'b1', cat: 'food',      limit: 1500000 },
  { id: 'b2', cat: 'transport', limit: 1500000 },
  { id: 'b3', cat: 'shopping',  limit: 1000000 },
  { id: 'b4', cat: 'bills',     limit: 500000 },
];

const SEED_RECURRING = [
  { id: 'r1', kind: 'income',  cat: 'salary', wallet: 'card', amount: 12000000, note: 'Monthly salary', every: 'month', nextDate: daysFromNow(13), enabled: true },
  { id: 'r2', kind: 'expense', cat: 'rent',   wallet: 'card', amount: 3500000,  note: 'Rent',           every: 'month', nextDate: daysFromNow(17), enabled: true },
  { id: 'r3', kind: 'expense', cat: 'bills',  wallet: 'card', amount: 220000,   note: 'Internet',       every: 'month', nextDate: daysFromNow(11), enabled: true },
];

const SEED_NOTIFS = [
  { id: 'n1', kind: 'overdue',  title: { en: 'Madina\u2019s debt is overdue', uz: 'Madina qarzi muddati o\u2018tdi' }, body: { en: '300 000 so\u2018m was due 3 days ago.', uz: '300 000 so\u2018m 3 kun oldin muddati tugagan.' }, date: daysAgo(0), read: false },
  { id: 'n2', kind: 'budget',   title: { en: 'Transport budget 82%', uz: 'Transport byudjeti 82%' }, body: { en: 'You\u2019ve used 1 235 000 of 1 500 000 so\u2018m.', uz: '1 500 000 so\u2018mdan 1 235 000 ishlatildi.' }, date: daysAgo(1), read: false },
  { id: 'n3', kind: 'bill',     title: { en: 'Rent due soon', uz: 'Ijara to\u2018lovi yaqin' }, body: { en: 'Apartment rent \u2014 due in 17 days.', uz: 'Ijara to\u2018lovi \u2014 17 kundan keyin.' }, date: daysAgo(2), read: true },
  { id: 'n4', kind: 'income',   title: { en: 'Freelance income added', uz: 'Frilans daromad qo\u2018shildi' }, body: { en: '+800 000 so\u2018m to Visa Card.', uz: 'Visa Kartaga +800 000 so\u2018m.' }, date: daysAgo(2), read: true },
];

const SEED_GOAL = {
  title: { en: 'New laptop', uz: 'Yangi noutbuk' },
  target: 15_000_000, saved: 6_200_000, deadline: daysFromNow(90),
};

const SEED = () => ({
  version: 2,
  onboarded: false,
  loggedIn: false,
  profile: { name: 'Sardor Akmalov', email: 'sardor.akmalov@gmail.com', avatar: 'SA', pro: true },
  prefs: {
    lang: 'en',          // en | uz
    currency: 'UZS',     // UZS | USD
    dark: false,
    pin: false,
    notifications: true,
    biometric: false,
  },
  categories: SEED_CATEGORIES,
  wallets:    SEED_WALLETS,
  tx:         SEED_TX,
  debts:      SEED_DEBTS,
  budgets:    SEED_BUDGETS,
  recurring:  SEED_RECURRING,
  notifs:     SEED_NOTIFS,
  goal:       SEED_GOAL,
});

// ── Store ─────────────────────────────────────────
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED();
    const parsed = JSON.parse(raw);
    if (parsed.version !== 2) return SEED();
    return parsed;
  } catch { return SEED(); }
}
function saveState(s) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {} }

const listeners = new Set();
let state = loadState();

const store = {
  get: () => state,
  set: (updater) => {
    state = typeof updater === 'function' ? updater(state) : { ...state, ...updater };
    saveState(state);
    listeners.forEach(fn => fn(state));
  },
  subscribe: (fn) => { listeners.add(fn); return () => listeners.delete(fn); },
  reset: () => { state = SEED(); saveState(state); listeners.forEach(fn => fn(state)); },
};

function useStore() {
  const [s, setS] = React.useState(state);
  React.useEffect(() => store.subscribe(setS), []);
  return s;
}

// ── Actions (pure helpers over store) ─────────────
const actions = {
  // Auth / onboarding
  completeOnboarding: () => store.set(s => ({ ...s, onboarded: true })),
  login:  () => store.set(s => ({ ...s, loggedIn: true,  onboarded: true })),
  logout: () => store.set(s => ({ ...s, loggedIn: false })),

  // Prefs
  setPref: (k, v) => store.set(s => ({ ...s, prefs: { ...s.prefs, [k]: v } })),

  // Transactions
  addTx: (tx) => store.set(s => {
    const id = 't' + Date.now();
    const newTx = { id, ...tx };
    const wallets = s.wallets.map(w => {
      if (w.id !== tx.wallet) return w;
      const delta = tx.kind === 'income' ? tx.amount : -tx.amount;
      return { ...w, balance: w.balance + delta };
    });
    return { ...s, tx: [newTx, ...s.tx], wallets };
  }),
  updateTx: (id, patch) => store.set(s => {
    const old = s.tx.find(x => x.id === id);
    if (!old) return s;
    const next = { ...old, ...patch };
    // Reverse old wallet effect, apply new
    const wallets = s.wallets.map(w => {
      let bal = w.balance;
      if (w.id === old.wallet) bal -= (old.kind === 'income' ? old.amount : -old.amount);
      if (w.id === next.wallet) bal += (next.kind === 'income' ? next.amount : -next.amount);
      return { ...w, balance: bal };
    });
    return { ...s, tx: s.tx.map(x => x.id === id ? next : x), wallets };
  }),
  deleteTx: (id) => store.set(s => {
    const old = s.tx.find(x => x.id === id);
    if (!old) return s;
    const wallets = s.wallets.map(w => {
      if (w.id !== old.wallet) return w;
      const delta = old.kind === 'income' ? -old.amount : old.amount;
      return { ...w, balance: w.balance + delta };
    });
    return { ...s, tx: s.tx.filter(x => x.id !== id), wallets };
  }),

  // Debts
  addDebt: (d) => store.set(s => ({ ...s, debts: [{ id: 'd' + Date.now(), paid: 0, payments: [], created: isoDate(today()), ...d }, ...s.debts] })),
  updateDebt: (id, patch) => store.set(s => ({ ...s, debts: s.debts.map(d => d.id === id ? { ...d, ...patch } : d) })),
  deleteDebt: (id) => store.set(s => ({ ...s, debts: s.debts.filter(d => d.id !== id) })),
  addPayment: (debtId, amount) => store.set(s => ({
    ...s,
    debts: s.debts.map(d => d.id === debtId
      ? { ...d, paid: d.paid + amount, payments: [...d.payments, { id: 'p' + Date.now(), amount, date: isoDate(today()) }] }
      : d),
  })),
  archiveDebt: (id) => store.set(s => ({ ...s, debts: s.debts.map(d => d.id === id ? { ...d, archived: true, paid: d.amount } : d) })),

  // Categories
  addCategory: (c) => store.set(s => ({ ...s, categories: [...s.categories, { id: 'c' + Date.now(), ...c }] })),
  updateCategory: (id, patch) => store.set(s => ({ ...s, categories: s.categories.map(c => c.id === id ? { ...c, ...patch } : c) })),
  deleteCategory: (id) => store.set(s => ({ ...s, categories: s.categories.filter(c => c.id !== id) })),

  // Wallets
  addWallet: (w) => store.set(s => ({ ...s, wallets: [...s.wallets, { id: 'w' + Date.now(), balance: 0, ...w }] })),
  updateWallet: (id, patch) => store.set(s => ({ ...s, wallets: s.wallets.map(w => w.id === id ? { ...w, ...patch } : w) })),
  deleteWallet: (id) => store.set(s => ({ ...s, wallets: s.wallets.filter(w => w.id !== id) })),

  // Budgets
  addBudget: (b) => store.set(s => ({ ...s, budgets: [...s.budgets, { id: 'b' + Date.now(), ...b }] })),
  updateBudget: (id, patch) => store.set(s => ({ ...s, budgets: s.budgets.map(b => b.id === id ? { ...b, ...patch } : b) })),
  deleteBudget: (id) => store.set(s => ({ ...s, budgets: s.budgets.filter(b => b.id !== id) })),

  // Recurring
  addRecurring: (r) => store.set(s => ({ ...s, recurring: [...s.recurring, { id: 'r' + Date.now(), enabled: true, ...r }] })),
  updateRecurring: (id, patch) => store.set(s => ({ ...s, recurring: s.recurring.map(r => r.id === id ? { ...r, ...patch } : r) })),
  deleteRecurring: (id) => store.set(s => ({ ...s, recurring: s.recurring.filter(r => r.id !== id) })),

  // Notifications
  markNotifRead: (id) => store.set(s => ({ ...s, notifs: s.notifs.map(n => n.id === id ? { ...n, read: true } : n) })),
  markAllNotifsRead: () => store.set(s => ({ ...s, notifs: s.notifs.map(n => ({ ...n, read: true })) })),
  clearNotifs: () => store.set(s => ({ ...s, notifs: [] })),
};

// ── i18n ─────────────────────────────────────────
const STRINGS = {
  en: {
    // tabs
    home: 'Home', statistics: 'Statistics', debtors: 'Debtors', profile: 'Profile',
    // home
    goodMorning: 'Good morning', goodAfternoon: 'Good afternoon', goodEvening: 'Good evening',
    netThisMonth: 'NET THIS MONTH', income: 'Income', expenses: 'Expenses', income_s: 'Income', expense_s: 'Expense',
    keptPct: 'You kept {pct}% of your income',
    addIncome: 'Income', addExpense: 'Expense', lend: 'Lend',
    recentActivity: 'Recent activity', seeAll: 'See all',
    upcomingBills: 'Upcoming bills', savingsGoal: 'Savings goal', myWallets: 'My wallets', daily: 'Daily spending',
    // common
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', add: 'Add', done: 'Done', back: 'Back',
    amount: 'Amount', category: 'Category', note: 'Note', wallet: 'Wallet', date: 'Date',
    // screens
    allTransactions: 'All transactions', transactionDetail: 'Transaction', searchPlaceholder: 'Search notes, categories…',
    notifications: 'Notifications', budgets: 'Budgets', categoriesLabel: 'Categories', wallets: 'Wallets', calendar: 'Calendar', reports: 'Reports',
    language: 'Language', currency: 'Currency', security: 'Security',
    // debtors
    totalOwedYou: 'TOTAL OWED TO YOU', totalYouOwe: 'TOTAL YOU OWE',
    oweMe: 'They owe me', iOwe: 'I owe', active: 'Active', overdue: 'Overdue', dueThisWeek: 'Due this week',
    markPaid: 'Mark paid', addPayment: 'Add payment', payments: 'Payments', remaining: 'Remaining', paid: 'Paid',
    noDebtors: 'No debtors yet', noDebtorsSub: 'Tap + to record who owes you',
    // add sheet
    newTransaction: 'New transaction', newDebt: 'New debt', person: 'Person', dueDate: 'Due date',
    newCategory: 'New category', name: 'Name', color: 'Color', icon: 'Icon',
    // empty / toast
    saved: 'Saved', deleted: 'Deleted', paidOff: 'Marked as paid',
    // profile
    pro: 'PRO MEMBER', preferences: 'Preferences', account: 'Account', more: 'More',
    darkMode: 'Dark mode', lightMode: 'Light mode', notifications_s: 'Notifications', pinLock: 'Security & PIN', exportData: 'Export data',
    helpSupport: 'Help & Support', settings: 'Settings', signOut: 'Sign out', resetData: 'Reset demo data',
    // login
    welcome: 'Welcome back', signIn: 'Sign in', signUp: 'Sign up', email: 'Email', password: 'Password',
    orContinue: 'or continue with', continueBtn: 'Continue', noAccount: "Don't have an account?",
    // onboarding
    trackSalary: 'Track your salary', trackSalarySub: 'See exactly where every so\u2018m goes, every month.',
    manageDebtors: 'Manage debtors', manageDebtorsSub: 'Know who owes you \u2014 and never forget.',
    staySavings: 'Grow your savings', staySavingsSub: 'Set goals, stay on budget, get ahead.',
    getStarted: 'Get started', next: 'Next', skip: 'Skip',
    // budget
    budgetLimit: 'Monthly limit', spent: 'spent', left: 'left', overspent: 'overspent',
    // general
    thisMonth: 'This month', lastMonth: 'Last month', today: 'Today', yesterday: 'Yesterday',
    noTransactions: 'No transactions', noTransactionsSub: 'Tap + to add your first one',
  },
  uz: {
    home: 'Bosh', statistics: 'Statistika', debtors: 'Qarzdorlar', profile: 'Profil',
    goodMorning: 'Xayrli tong', goodAfternoon: 'Xayrli kun', goodEvening: 'Xayrli kech',
    netThisMonth: 'SOF DAROMAD (OY)', income: 'Kirim', expenses: 'Chiqim', income_s: 'Kirim', expense_s: 'Chiqim',
    keptPct: 'Daromadning {pct}% ini saqladingiz',
    addIncome: 'Kirim', addExpense: 'Chiqim', lend: 'Qarz berdim',
    recentActivity: 'So\u2018nggi amallar', seeAll: 'Barchasi',
    upcomingBills: 'Yaqinlashayotgan to\u2018lovlar', savingsGoal: 'Jamg\u2018arma maqsadi', myWallets: 'Hamyonlarim', daily: 'Kunlik xarajat',
    save: 'Saqlash', cancel: 'Bekor', delete: 'O\u2018chirish', edit: 'Tahrirlash', add: 'Qo\u2018shish', done: 'Tayyor', back: 'Orqaga',
    amount: 'Summa', category: 'Toifa', note: 'Izoh', wallet: 'Hamyon', date: 'Sana',
    allTransactions: 'Barcha amallar', transactionDetail: 'Amal', searchPlaceholder: 'Izoh, toifa bo\u2018yicha qidirish\u2026',
    notifications: 'Bildirishnomalar', budgets: 'Byudjetlar', categoriesLabel: 'Toifalar', wallets: 'Hamyonlar', calendar: 'Taqvim', reports: 'Hisobotlar',
    language: 'Til', currency: 'Valyuta', security: 'Xavfsizlik',
    totalOwedYou: 'SIZGA QARZDORLAR', totalYouOwe: 'SIZ QARZDORSIZ',
    oweMe: 'Menga qarz', iOwe: 'Men qarzman', active: 'Faol', overdue: 'Muddati o\u2018tgan', dueThisWeek: 'Shu hafta',
    markPaid: 'To\u2018landi', addPayment: 'To\u2018lov qo\u2018shish', payments: 'To\u2018lovlar', remaining: 'Qoldi', paid: 'To\u2018langan',
    noDebtors: 'Qarzdorlar yo\u2018q', noDebtorsSub: 'Qo\u2018shish uchun + ni bosing',
    newTransaction: 'Yangi amal', newDebt: 'Yangi qarz', person: 'Shaxs', dueDate: 'Muddat',
    newCategory: 'Yangi toifa', name: 'Nomi', color: 'Rang', icon: 'Ikonka',
    saved: 'Saqlandi', deleted: 'O\u2018chirildi', paidOff: 'To\u2018landi deb belgilandi',
    pro: 'PRO A\u2019ZO', preferences: 'Sozlamalar', account: 'Hisob', more: 'Boshqa',
    darkMode: 'Tungi rejim', lightMode: 'Kunduzgi rejim', notifications_s: 'Bildirishnomalar', pinLock: 'Xavfsizlik va PIN', exportData: 'Ma\u2019lumotni eksport',
    helpSupport: 'Yordam', settings: 'Sozlamalar', signOut: 'Chiqish', resetData: 'Demo ma\u2019lumotni tiklash',
    welcome: 'Xush kelibsiz', signIn: 'Kirish', signUp: 'Ro\u2018yxat', email: 'Email', password: 'Parol',
    orContinue: 'yoki davom eting', continueBtn: 'Davom etish', noAccount: 'Hisobingiz yo\u2018qmi?',
    trackSalary: 'Maoshni kuzating', trackSalarySub: 'Har bir so\u2018m qayerga ketganini ko\u2018ring.',
    manageDebtors: 'Qarzlarni boshqaring', manageDebtorsSub: 'Kim qarzdorligini unutmang.',
    staySavings: 'Jamg\u2018armangizni oshiring', staySavingsSub: 'Maqsad qo\u2018ying, byudjetda qoling.',
    getStarted: 'Boshlash', next: 'Keyingi', skip: 'O\u2018tkazish',
    budgetLimit: 'Oylik limit', spent: 'ishlatildi', left: 'qoldi', overspent: 'oshib ketdi',
    thisMonth: 'Shu oy', lastMonth: 'O\u2018tgan oy', today: 'Bugun', yesterday: 'Kecha',
    noTransactions: 'Amallar yo\u2018q', noTransactionsSub: 'Birinchisini + orqali qo\u2018shing',
  },
};

function tStr(lang, key, vars) {
  let s = (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
  if (vars) Object.entries(vars).forEach(([k, v]) => { s = s.replace('{' + k + '}', v); });
  return s;
}
const catLabel = (cat, lang) => (cat?.label?.[lang] || cat?.label?.en || cat?.id || '');
const walletName = (w, lang) => (w?.name?.[lang] || w?.name?.en || w?.id || '');

// ── Money formatting / conversion ────────────────
const RATES = { UZS: 1, USD: 1 / 12500 }; // rough
const fmtMoney = (n, currency) => {
  const v = n * RATES[currency];
  if (currency === 'USD') {
    return (v < 0 ? '−' : '') + '$' + Math.abs(v).toFixed(2);
  }
  const s = Math.abs(Math.round(v)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (v < 0 ? '−' : '') + s;
};
const unitOf = (currency) => currency === 'USD' ? '' : "so'm";
const fmtDate = (iso, lang) => {
  if (!iso) return '';
  const d = new Date(iso);
  const t = today();
  const sameDay = (a, b) => isoDate(a) === isoDate(b);
  if (sameDay(d, t)) return tStr(lang, 'today');
  const yest = new Date(t); yest.setDate(t.getDate() - 1);
  if (sameDay(d, yest)) return tStr(lang, 'yesterday');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return months[d.getMonth()] + ' ' + d.getDate();
};
const monthKey = (iso) => iso.slice(0, 7); // 'YYYY-MM'

// ── Selectors ────────────────────────────────────
const selectMonth = (s, month /* YYYY-MM */) => {
  const tx = s.tx.filter(x => x.date.startsWith(month));
  const income = tx.filter(x => x.kind === 'income').reduce((a, x) => a + x.amount, 0);
  const expense = tx.filter(x => x.kind === 'expense').reduce((a, x) => a + x.amount, 0);
  return { tx, income, expense, net: income - expense };
};
const last6Months = () => {
  const out = [];
  const d = today();
  for (let i = 5; i >= 0; i--) {
    const nd = new Date(d.getFullYear(), d.getMonth() - i, 1);
    const key = `${nd.getFullYear()}-${String(nd.getMonth()+1).padStart(2,'0')}`;
    out.push({ key, label: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][nd.getMonth()] });
  }
  return out;
};

Object.assign(window, {
  store, actions, useStore, tStr, STRINGS,
  fmtMoney, unitOf, fmtDate, monthKey, isoDate, daysAgo, daysFromNow, today,
  selectMonth, last6Months, catLabel, walletName,
});
