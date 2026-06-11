import { walletsApi } from '../dataApi';
import { errorMessage } from '../errors';
import { store } from '../store';
import type { Budget, Category, Debt, Recurring, Transaction, Wallet } from '../store';
import { toast } from '../toast';
import { idmap } from './idmap';
import { budgetsSync } from './budgets';
import { categoriesSync } from './categories';
import { debtsSync } from './debts';
import { notificationsSync } from './notifications';
import { recurringSync } from './recurring';
import { transactionsSync } from './transactions';
import { walletsSync } from './wallets';

// SEED category ids that are client-only (subscription kind) — never pushed to server
const SEED_SUBSCRIPTION_IDS = new Set([
  'sub_streaming',
  'sub_internet',
  'sub_gym',
  'sub_software',
]);

// Pending create promises keyed by tempId, so concurrent pushes for the same
// entity coalesce onto the one in-flight request.
const pendingCreates: Map<string, Promise<string>> = new Map();

// ---------------------------------------------------------------------------
// Bootstrap: fetch all domains and merge into store in one set call
// ---------------------------------------------------------------------------

let bootstrapInFlight: Promise<void> | null = null;

export const bootstrapSync = (): Promise<void> => {
  if (bootstrapInFlight) return bootstrapInFlight;
  bootstrapInFlight = _runBootstrap().finally(() => {
    bootstrapInFlight = null;
  });
  return bootstrapInFlight;
};

const _runBootstrap = async (): Promise<void> => {
  await idmap.load();
  try {
    const currentState = store.get();

    // 1. Categories first (others may reference them)
    let serverCategories: Category[] | null = null;
    try {
      serverCategories = await categoriesSync.fetch();
      serverCategories.forEach((c) => {
        idmap.forDomain('categories').link(c.id, c.id);
      });
    } catch {}

    const fetchedCategories = serverCategories ?? currentState.categories;

    // Merge: server categories + ALL local-only categories the server doesn't
    // have yet (default seeds AND subscription seeds), so syncing never wipes
    // the user's default categories. Dedup against server cats by (kind|en):
    // if the server already has an equivalent of a local seed, link the seed's
    // id to it and drop the dup so a second device doesn't show two of each.
    const serverCatIds = new Set(fetchedCategories.map((c) => c.id));
    const serverSig = new Map(
      fetchedCategories.map((c) => [`${c.kind}|${c.label?.en ?? ''}`, c.id] as const),
    );
    const clientOnly = currentState.categories.filter((c) => {
      if (serverCatIds.has(c.id)) return false;
      if (idmap.forDomain('categories').toServer(c.id)) return false;
      const serverId = serverSig.get(`${c.kind}|${c.label?.en ?? ''}`);
      if (serverId) {
        idmap.forDomain('categories').link(c.id, serverId);
        return false;
      }
      return true;
    });
    const mergedCategories = [...fetchedCategories, ...clientOnly];

    // 2. Wallets (server-authoritative balances; preserve local hidden flags)
    let serverWallets: Wallet[] | null = null;
    try {
      serverWallets = await walletsSync.fetch();
      serverWallets.forEach((w) => {
        idmap.forDomain('wallets').link(w.id, w.id);
      });
    } catch {}

    const localWalletById = new Map(currentState.wallets.map((w) => [w.id, w]));
    const serverWalletIds = new Set((serverWallets ?? []).map((w) => w.id));
    const mergedWallets: Wallet[] =
      serverWallets !== null
        ? [
            ...serverWallets.map((sw) => {
              const local = localWalletById.get(sw.id);
              return local ? { ...sw, hidden: local.hidden } : sw;
            }),
            // Keep local wallets the server doesn't have yet so syncing never
            // wipes them; they lazy-create on first use. Drop a local wallet if
            // it is already mapped to a server id, or if a server wallet with
            // the same name already represents it (link + dedup) — otherwise a
            // lazily-synced seed wallet would show up twice.
            ...currentState.wallets.filter((w) => {
              if (serverWalletIds.has(w.id)) return false;
              if (idmap.forDomain('wallets').toServer(w.id)) return false;
              const match = (serverWallets ?? []).find(
                (sw) => (sw.name?.en ?? '') === (w.name?.en ?? ''),
              );
              if (match) {
                idmap.forDomain('wallets').link(w.id, match.id);
                return false;
              }
              return true;
            }),
          ]
        : currentState.wallets;

    // 3. Parallel fetch of remaining domains
    const [txResult, budgetsResult, debtsResult, recurringResult, notifsResult] =
      await Promise.allSettled([
        transactionsSync.fetch(),
        budgetsSync.fetch(),
        debtsSync.fetch(),
        recurringSync.fetch(),
        notificationsSync.fetch(),
      ]);

    const serverTx =
      txResult.status === 'fulfilled' ? txResult.value : currentState.tx;
    const serverBudgets =
      budgetsResult.status === 'fulfilled' ? budgetsResult.value : currentState.budgets;
    const serverDebts =
      debtsResult.status === 'fulfilled' ? debtsResult.value : currentState.debts;
    const serverRecurring =
      recurringResult.status === 'fulfilled' ? recurringResult.value : currentState.recurring;
    const serverNotifs =
      notifsResult.status === 'fulfilled' ? notifsResult.value : currentState.notifs;

    // Link ids for reconciliation
    serverTx.forEach((t) => idmap.forDomain('tx').link(t.id, t.id));
    serverBudgets.forEach((b) => idmap.forDomain('budgets').link(b.id, b.id));
    serverDebts.forEach((d) => idmap.forDomain('debts').link(d.id, d.id));
    serverRecurring.forEach((r) => idmap.forDomain('recurring').link(r.id, r.id));

    // Write everything in one atomic set — preserves goal, prefs, profile, hideBalance
    store.set((s) => ({
      ...s,
      categories: mergedCategories,
      wallets: mergedWallets,
      tx: serverTx,
      budgets: serverBudgets,
      debts: serverDebts,
      recurring: serverRecurring,
      notifs: serverNotifs,
    }));

    void idmap.forDomain('categories').persist().catch(() => {});
  } catch {
    // Bootstrap failures are non-fatal — keep existing local state
  }
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const getLang = () => store.get().prefs.lang;

const resolveServerId = async (domain: string, localId: string): Promise<string> => {
  const direct = idmap.forDomain(domain).toServer(localId);
  if (direct) return direct;
  // If there's a pending create for this localId, await it
  const pending = pendingCreates.get(localId);
  if (pending) return pending;
  // No mapping and no pending create — assume it's already a server id
  return localId;
};

// Resolve a local category id to its server id, lazily creating the category on
// the server the first time it is referenced. Default seed categories live only
// on the client until used; this pushes them on first reference so transactions
// can sync. Returns null for subscription-kind categories (the server has no
// equivalent) — callers should keep those records local-only.
const ensureCategoryId = async (localCatId: string): Promise<string | null> => {
  const mapped = idmap.forDomain('categories').toServer(localCatId);
  if (mapped) return mapped;
  const pending = pendingCreates.get(localCatId);
  if (pending) return pending;
  const cat = store.get().categories.find((c) => c.id === localCatId);
  if (!cat) return localCatId;
  if (SEED_SUBSCRIPTION_IDS.has(cat.id) || cat.kind === 'subscription') return null;
  const p = (async () => {
    try {
      const dto = await categoriesSync.create(cat);
      idmap.forDomain('categories').link(localCatId, dto._id);
      // Self-link so the rewritten (server) id also resolves and is not
      // mistaken for a new local category to re-create.
      idmap.forDomain('categories').link(dto._id, dto._id);
      void idmap.forDomain('categories').persist().catch(() => {});
      // Rewrite the local category id to the server id AND every reference to
      // it, so transactions/budgets/recurring keep matching their category
      // (otherwise the icon/name disappears until the next bootstrap).
      store.set((st) => ({
        ...st,
        categories: st.categories.map((c) => (c.id === localCatId ? { ...c, id: dto._id } : c)),
        tx: st.tx.map((x) => (x.cat === localCatId ? { ...x, cat: dto._id } : x)),
        budgets: st.budgets.map((b) => (b.cat === localCatId ? { ...b, cat: dto._id } : b)),
        recurring: st.recurring.map((r) => (r.cat === localCatId ? { ...r, cat: dto._id } : r)),
      }));
      return dto._id;
    } finally {
      pendingCreates.delete(localCatId);
    }
  })();
  pendingCreates.set(localCatId, p);
  return p;
};

// Resolve a local wallet id to its server id, lazily creating the wallet on the
// server the first time it is referenced (wallets are never wiped from local
// state but may not be on the server yet). Returns null when there is no wallet
// to sync (empty id), so callers keep that record local-only.
const ensureWalletId = async (localWalletId: string): Promise<string | null> => {
  if (!localWalletId) return null;
  const mapped = idmap.forDomain('wallets').toServer(localWalletId);
  if (mapped) return mapped;
  const pending = pendingCreates.get(localWalletId);
  if (pending) return pending;
  const wallet = store.get().wallets.find((w) => w.id === localWalletId);
  if (!wallet) return localWalletId;
  const p = (async () => {
    try {
      const dto = await walletsSync.create(wallet);
      idmap.forDomain('wallets').link(localWalletId, dto._id);
      idmap.forDomain('wallets').link(dto._id, dto._id);
      void idmap.forDomain('wallets').persist().catch(() => {});
      // Rewrite the local wallet id to the server id and every reference, so
      // transactions/recurring keep matching their wallet.
      store.set((st) => ({
        ...st,
        wallets: st.wallets.map((w) => (w.id === localWalletId ? { ...w, id: dto._id } : w)),
        tx: st.tx.map((x) => (x.wallet === localWalletId ? { ...x, wallet: dto._id } : x)),
        recurring: st.recurring.map((r) =>
          r.wallet === localWalletId ? { ...r, wallet: dto._id } : r,
        ),
      }));
      return dto._id;
    } finally {
      pendingCreates.delete(localWalletId);
    }
  })();
  pendingCreates.set(localWalletId, p);
  return p;
};

const refreshWalletBalances = async (): Promise<void> => {
  try {
    const { items } = await walletsApi.list();
    store.set((s) => ({
      ...s,
      wallets: s.wallets.map((w) => {
        const sv = items.find((i) => i._id === w.id || idmap.forDomain('wallets').toServer(w.id) === i._id);
        return sv ? { ...w, balance: sv.balance } : w;
      }),
    }));
  } catch {}
};

// ---------------------------------------------------------------------------
// Push helpers
// ---------------------------------------------------------------------------

export const push = {
  categories: {
    async create(local: Category, revert: () => void): Promise<void> {
      const tempId = local.id;
      if (SEED_SUBSCRIPTION_IDS.has(tempId)) return;
      if (local.kind === 'subscription') return;

      const createPromise: Promise<string> = (async () => {
        try {
          const dto = await categoriesSync.create(local);
          idmap.forDomain('categories').link(tempId, dto._id);
          store.set((s) => ({
            ...s,
            categories: s.categories.map((c) =>
              c.id === tempId ? categoriesSync.toLocal(dto) : c,
            ),
          }));
          void idmap.forDomain('categories').persist().catch(() => {});
          return dto._id;
        } catch (err) {
          revert();
          toast.error(errorMessage(getLang(), err));
          throw err;
        } finally {
          pendingCreates.delete(tempId);
        }
      })();

      pendingCreates.set(tempId, createPromise);
      await createPromise.catch(() => {});
    },

    async remove(localId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('categories', localId);
        await categoriesSync.remove(serverId);
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },

  wallets: {
    async create(local: Wallet, revert: () => void): Promise<void> {
      const tempId = local.id;
      const createPromise: Promise<string> = (async () => {
        try {
          const dto = await walletsSync.create(local);
          idmap.forDomain('wallets').link(tempId, dto._id);
          const localResult = walletsSync.toLocal(dto);
          store.set((s) => ({
            ...s,
            wallets: s.wallets.map((w) =>
              w.id === tempId ? { ...localResult, hidden: w.hidden } : w,
            ),
          }));
          void idmap.forDomain('wallets').persist().catch(() => {});
          return dto._id;
        } catch (err) {
          revert();
          toast.error(errorMessage(getLang(), err));
          throw err;
        } finally {
          pendingCreates.delete(tempId);
        }
      })();

      pendingCreates.set(tempId, createPromise);
      await createPromise.catch(() => {});
    },

    async update(localId: string, patch: Partial<Wallet>, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('wallets', localId);
        const dto = await walletsSync.update(serverId, patch);
        const updated = walletsSync.toLocal(dto);
        store.set((s) => ({
          ...s,
          wallets: s.wallets.map((w) =>
            w.id === localId ? { ...updated, hidden: w.hidden } : w,
          ),
        }));
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },

    async remove(localId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('wallets', localId);
        await walletsSync.remove(serverId);
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },

  tx: {
    async create(local: Transaction, revert: () => void): Promise<void> {
      const tempId = local.id;
      const createPromise: Promise<string> = (async () => {
        try {
          // Resolve cat and wallet to server ids (lazily create seed category)
          const catServerId = await ensureCategoryId(local.cat);
          if (catServerId === null) {
            // subscription-category tx — server has no such category; keep local-only
            return tempId;
          }
          const walletServerId = await ensureWalletId(local.wallet);
          if (walletServerId === null) {
            // no syncable wallet — keep tx local-only
            return tempId;
          }
          const resolved: Transaction = { ...local, cat: catServerId, wallet: walletServerId };
          const dto = await transactionsSync.create(resolved);
          idmap.forDomain('tx').link(tempId, dto._id);
          void idmap.forDomain('tx').persist().catch(() => {});
          store.set((s) => ({
            ...s,
            tx: s.tx.map((t) => {
              if (t.id !== tempId) return t;
              const prev = t;
              return { ...transactionsSync.toLocal(dto), time: prev.time };
            }),
          }));
          await refreshWalletBalances();
          return dto._id;
        } catch (err) {
          revert();
          toast.error(errorMessage(getLang(), err));
          throw err;
        } finally {
          pendingCreates.delete(tempId);
        }
      })();

      pendingCreates.set(tempId, createPromise);
      await createPromise.catch(() => {});
    },

    async update(localId: string, patch: Partial<Transaction>, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('tx', localId);
        const resolvedPatch: Partial<Transaction> = { ...patch };
        if (patch.cat) {
          const resolvedCat = await ensureCategoryId(patch.cat);
          if (resolvedCat) resolvedPatch.cat = resolvedCat;
          else delete resolvedPatch.cat;
        }
        if (patch.wallet) {
          const resolvedW = await ensureWalletId(patch.wallet);
          if (resolvedW) resolvedPatch.wallet = resolvedW;
          else delete resolvedPatch.wallet;
        }
        const dto = await transactionsSync.update(serverId, resolvedPatch);
        store.set((s) => ({
          ...s,
          tx: s.tx.map((t) =>
            t.id === localId || t.id === serverId ? transactionsSync.toLocal(dto) : t,
          ),
        }));
        await refreshWalletBalances();
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },

    async remove(localId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('tx', localId);
        await transactionsSync.remove(serverId);
        await refreshWalletBalances();
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },

  budgets: {
    async create(local: Budget, revert: () => void): Promise<void> {
      const tempId = local.id;
      const createPromise: Promise<string> = (async () => {
        try {
          const catServerId = await ensureCategoryId(local.cat);
          if (catServerId === null) {
            // subscription-category budget — cannot sync; keep local-only
            return tempId;
          }
          const resolved: Budget = { ...local, cat: catServerId };
          const dto = await budgetsSync.create(resolved);
          idmap.forDomain('budgets').link(tempId, dto._id);
          store.set((s) => ({
            ...s,
            budgets: s.budgets.map((b) =>
              b.id === tempId ? budgetsSync.toLocal(dto) : b,
            ),
          }));
          void idmap.forDomain('budgets').persist().catch(() => {});
          return dto._id;
        } catch (err) {
          revert();
          toast.error(errorMessage(getLang(), err));
          throw err;
        } finally {
          pendingCreates.delete(tempId);
        }
      })();

      pendingCreates.set(tempId, createPromise);
      await createPromise.catch(() => {});
    },

    async remove(localId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('budgets', localId);
        await budgetsSync.remove(serverId);
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },

  debts: {
    async create(local: Debt, revert: () => void): Promise<void> {
      const tempId = local.id;
      const createPromise: Promise<string> = (async () => {
        try {
          const dto = await debtsSync.create(local);
          idmap.forDomain('debts').link(tempId, dto._id);
          store.set((s) => ({
            ...s,
            debts: s.debts.map((d) =>
              d.id === tempId ? debtsSync.toLocal(dto) : d,
            ),
          }));
          void idmap.forDomain('debts').persist().catch(() => {});
          return dto._id;
        } catch (err) {
          revert();
          toast.error(errorMessage(getLang(), err));
          throw err;
        } finally {
          pendingCreates.delete(tempId);
        }
      })();

      pendingCreates.set(tempId, createPromise);
      await createPromise.catch(() => {});
    },

    async update(localId: string, patch: Partial<Debt>, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('debts', localId);
        const dto = await debtsSync.update(serverId, patch);
        store.set((s) => ({
          ...s,
          debts: s.debts.map((d) =>
            d.id === localId || d.id === serverId ? debtsSync.toLocal(dto) : d,
          ),
        }));
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },

    async remove(localId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('debts', localId);
        await debtsSync.remove(serverId);
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },

    async addPayment(
      localDebtId: string,
      amount: number,
      date: string,
      revert: () => void,
    ): Promise<void> {
      try {
        const serverId = await resolveServerId('debts', localDebtId);
        const dto = await debtsSync.addPayment(serverId, { amount, date });
        store.set((s) => ({
          ...s,
          debts: s.debts.map((d) =>
            d.id === localDebtId || d.id === serverId ? debtsSync.toLocal(dto) : d,
          ),
        }));
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },

    async archive(localDebtId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('debts', localDebtId);
        const dto = await debtsSync.archive(serverId);
        store.set((s) => ({
          ...s,
          debts: s.debts.map((d) =>
            d.id === localDebtId || d.id === serverId ? debtsSync.toLocal(dto) : d,
          ),
        }));
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },

  recurring: {
    async update(localId: string, patch: Partial<Recurring>, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('recurring', localId);
        const resolvedPatch: Partial<Recurring> = { ...patch };
        if (patch.cat) {
          const resolvedCat = await ensureCategoryId(patch.cat);
          if (resolvedCat) resolvedPatch.cat = resolvedCat;
          else delete resolvedPatch.cat;
        }
        if (patch.wallet) {
          const resolvedW = await ensureWalletId(patch.wallet);
          if (resolvedW) resolvedPatch.wallet = resolvedW;
          else delete resolvedPatch.wallet;
        }
        const dto = await recurringSync.update(serverId, resolvedPatch);
        store.set((s) => ({
          ...s,
          recurring: s.recurring.map((r) =>
            r.id === localId ? recurringSync.toLocal(dto) : r,
          ),
        }));
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },

  notifs: {
    async markRead(localId: string, revert: () => void): Promise<void> {
      try {
        const serverId = await resolveServerId('notifs', localId);
        await notificationsSync.markRead(serverId);
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },

    async markAllRead(revert: () => void): Promise<void> {
      try {
        await notificationsSync.markAllRead();
      } catch (err) {
        revert();
        toast.error(errorMessage(getLang(), err));
      }
    },
  },
};
