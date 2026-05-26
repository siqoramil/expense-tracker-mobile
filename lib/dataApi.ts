import { apiRequest } from './api';

export type BilingualString = { en: string; uz: string };

export type WalletDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  name: BilingualString;
  icon: string;
  color: string;
  balance: number;
};

export type CreateWalletInput = {
  name: BilingualString;
  icon: string;
  color: string;
  balance?: number;
};

export type UpdateWalletInput = {
  name?: BilingualString;
  icon?: string;
  color?: string;
};

export type TransactionKind = 'income' | 'expense';

export type TransactionDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  kind: TransactionKind;
  cat: string;
  wallet: string;
  amount: number;
  note?: string;
  date: string;
};

export type CreateTransactionInput = {
  kind: TransactionKind;
  cat: string;
  wallet: string;
  amount: number;
  note?: string;
  date: string;
};

export type UpdateTransactionInput = Partial<CreateTransactionInput>;

export type TransactionStats = {
  income: number;
  expense: number;
  net: number;
  count: number;
};

export type BudgetDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  cat: string;
  limit: number;
};

export type CreateBudgetInput = {
  cat: string;
  limit: number;
};

export type UpdateBudgetInput = {
  limit?: number;
};

export type DebtDirection = 'owe_me' | 'i_owe';

export type DebtPaymentDTO = {
  _id: string;
  amount: number;
  date: string;
};

export type DebtDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  direction: DebtDirection;
  name: string;
  color?: string;
  amount: number;
  paid: number;
  due: string;
  note?: string;
  payments: DebtPaymentDTO[];
  archived?: boolean;
};

export type CreateDebtInput = {
  direction: DebtDirection;
  name: string;
  color?: string;
  amount: number;
  due: string;
  note?: string;
};

export type UpdateDebtInput = Partial<CreateDebtInput>;

export type DebtPaymentInput = {
  amount: number;
  date?: string;
};

export type CategoryKind = 'income' | 'expense';

export type CategoryDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  label: BilingualString;
  icon: string;
  color: string;
  kind: CategoryKind;
};

export type CreateCategoryInput = {
  label: BilingualString;
  icon: string;
  color: string;
  kind: CategoryKind;
};

export type UpdateCategoryInput = Partial<CreateCategoryInput>;

export type RecurringEvery = 'month' | 'week';

export type RecurringDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  kind: TransactionKind;
  cat: string;
  wallet: string;
  amount: number;
  note?: string;
  every?: RecurringEvery;
  nextDate: string;
  enabled?: boolean;
};

export type CreateRecurringInput = {
  kind: TransactionKind;
  cat: string;
  wallet: string;
  amount: number;
  note?: string;
  every?: RecurringEvery;
  nextDate: string;
  enabled?: boolean;
};

export type UpdateRecurringInput = Partial<CreateRecurringInput>;

export type NotificationKind = 'overdue' | 'budget' | 'bill' | 'income';

export type NotificationDTO = {
  _id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  kind: NotificationKind;
  title: BilingualString;
  body: BilingualString;
  date: string;
  read: boolean;
};

export const walletsApi = {
  list: () => apiRequest<{ items: WalletDTO[] }>('/wallets'),
  create: (body: CreateWalletInput) =>
    apiRequest<{ item: WalletDTO }>('/wallets', { method: 'POST', body }),
  update: (id: string, body: UpdateWalletInput) =>
    apiRequest<{ item: WalletDTO }>(`/wallets/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/wallets/${id}`, { method: 'DELETE' }),
};

export const transactionsApi = {
  list: (query?: { month?: string; kind?: TransactionKind }) => {
    const params = new URLSearchParams();
    if (query?.month) params.set('month', query.month);
    if (query?.kind) params.set('kind', query.kind);
    const qs = params.toString();
    return apiRequest<{ items: TransactionDTO[] }>(`/tx${qs ? `?${qs}` : ''}`);
  },
  create: (body: CreateTransactionInput) =>
    apiRequest<{ item: TransactionDTO }>('/tx', { method: 'POST', body }),
  update: (id: string, body: UpdateTransactionInput) =>
    apiRequest<{ item: TransactionDTO }>(`/tx/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/tx/${id}`, { method: 'DELETE' }),
  stats: (month: string) =>
    apiRequest<TransactionStats>(`/tx/stats/${month}`),
};

export const budgetsApi = {
  list: () => apiRequest<{ items: BudgetDTO[] }>('/budgets'),
  create: (body: CreateBudgetInput) =>
    apiRequest<{ item: BudgetDTO }>('/budgets', { method: 'POST', body }),
  update: (id: string, body: UpdateBudgetInput) =>
    apiRequest<{ item: BudgetDTO }>(`/budgets/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/budgets/${id}`, { method: 'DELETE' }),
};

export const debtsApi = {
  list: (query?: { archived?: boolean }) => {
    const qs = query?.archived ? '?archived=true' : '';
    return apiRequest<{ items: DebtDTO[] }>(`/debts${qs}`);
  },
  create: (body: CreateDebtInput) =>
    apiRequest<{ item: DebtDTO }>('/debts', { method: 'POST', body }),
  update: (id: string, body: UpdateDebtInput) =>
    apiRequest<{ item: DebtDTO }>(`/debts/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/debts/${id}`, { method: 'DELETE' }),
  addPayment: (id: string, body: DebtPaymentInput) =>
    apiRequest<{ item: DebtDTO }>(`/debts/${id}/payments`, { method: 'POST', body }),
  archive: (id: string) =>
    apiRequest<{ item: DebtDTO }>(`/debts/${id}/archive`, { method: 'POST' }),
};

export const categoriesApi = {
  list: () => apiRequest<{ items: CategoryDTO[] }>('/categories'),
  create: (body: CreateCategoryInput) =>
    apiRequest<{ item: CategoryDTO }>('/categories', { method: 'POST', body }),
  update: (id: string, body: UpdateCategoryInput) =>
    apiRequest<{ item: CategoryDTO }>(`/categories/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/categories/${id}`, { method: 'DELETE' }),
};

export const recurringApi = {
  list: () => apiRequest<{ items: RecurringDTO[] }>('/recurring'),
  create: (body: CreateRecurringInput) =>
    apiRequest<{ item: RecurringDTO }>('/recurring', { method: 'POST', body }),
  update: (id: string, body: UpdateRecurringInput) =>
    apiRequest<{ item: RecurringDTO }>(`/recurring/${id}`, { method: 'PATCH', body }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/recurring/${id}`, { method: 'DELETE' }),
};

export const notificationsApi = {
  list: () => apiRequest<{ items: NotificationDTO[] }>('/notifs'),
  markRead: (id: string) =>
    apiRequest<{ item: NotificationDTO }>(`/notifs/${id}/read`, { method: 'POST' }),
  markAllRead: () =>
    apiRequest<{ ok: true }>('/notifs/read-all', { method: 'POST' }),
  remove: (id: string) =>
    apiRequest<{ ok: true }>(`/notifs/${id}`, { method: 'DELETE' }),
};
