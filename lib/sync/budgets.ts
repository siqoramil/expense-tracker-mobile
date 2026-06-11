import { budgetsApi, type BudgetDTO, type CreateBudgetInput, type UpdateBudgetInput } from '../dataApi';
import type { Budget } from '../store';
import type { SyncModule } from './types';

export const budgetsSync: SyncModule<Budget, BudgetDTO, CreateBudgetInput, UpdateBudgetInput> = {
  domain: 'budgets',

  toLocal(dto: BudgetDTO): Budget {
    return {
      id: dto._id,
      cat: dto.cat,
      limit: dto.limit,
    };
  },

  toCreate(local: Budget): CreateBudgetInput {
    return {
      cat: local.cat,
      limit: local.limit,
    };
  },

  toUpdate(patch: Partial<Budget>): UpdateBudgetInput {
    const out: UpdateBudgetInput = {};
    if (patch.limit !== undefined) out.limit = patch.limit;
    return out;
  },

  async fetch(): Promise<Budget[]> {
    const { items } = await budgetsApi.list();
    return items.map((dto) => budgetsSync.toLocal(dto));
  },

  async create(local: Budget): Promise<BudgetDTO> {
    const { item } = await budgetsApi.create(budgetsSync.toCreate(local));
    return item;
  },

  async update(serverId: string, patch: Partial<Budget>): Promise<BudgetDTO> {
    const { item } = await budgetsApi.update(serverId, budgetsSync.toUpdate(patch));
    return item;
  },

  async remove(serverId: string): Promise<void> {
    await budgetsApi.remove(serverId);
  },
};
