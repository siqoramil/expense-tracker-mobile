import { recurringApi, type RecurringDTO, type CreateRecurringInput, type UpdateRecurringInput } from '../dataApi';
import type { Recurring } from '../store';
import type { SyncModule } from './types';

export const recurringSync: SyncModule<Recurring, RecurringDTO, CreateRecurringInput, UpdateRecurringInput> = {
  domain: 'recurring',

  toLocal(dto: RecurringDTO): Recurring {
    return {
      id: dto._id,
      kind: dto.kind,
      cat: dto.cat,
      wallet: dto.wallet,
      amount: dto.amount,
      note: dto.note ?? '',
      every: dto.every ?? 'month',
      nextDate: dto.nextDate,
      enabled: dto.enabled ?? true,
    };
  },

  toCreate(local: Recurring): CreateRecurringInput {
    return {
      kind: local.kind,
      cat: local.cat,
      wallet: local.wallet,
      amount: local.amount,
      note: local.note ?? '',
      every: local.every,
      nextDate: local.nextDate,
      enabled: local.enabled,
    };
  },

  toUpdate(patch: Partial<Recurring>): UpdateRecurringInput {
    const result: UpdateRecurringInput = {};
    if (patch.kind !== undefined) result.kind = patch.kind;
    if (patch.cat !== undefined) result.cat = patch.cat;
    if (patch.wallet !== undefined) result.wallet = patch.wallet;
    if (patch.amount !== undefined) result.amount = patch.amount;
    if (patch.note !== undefined) result.note = patch.note;
    if (patch.every !== undefined) result.every = patch.every;
    if (patch.nextDate !== undefined) result.nextDate = patch.nextDate;
    if (patch.enabled !== undefined) result.enabled = patch.enabled;
    return result;
  },

  async fetch(): Promise<Recurring[]> {
    const { items } = await recurringApi.list();
    return items.map((dto) => recurringSync.toLocal(dto));
  },

  async create(local: Recurring): Promise<RecurringDTO> {
    const { item } = await recurringApi.create(recurringSync.toCreate(local));
    return item;
  },

  async update(serverId: string, patch: Partial<Recurring>): Promise<RecurringDTO> {
    const { item } = await recurringApi.update(serverId, recurringSync.toUpdate(patch));
    return item;
  },

  async remove(serverId: string): Promise<void> {
    await recurringApi.remove(serverId);
  },
};
