import { debtsApi, type DebtDTO, type CreateDebtInput, type UpdateDebtInput, type DebtPaymentInput } from '../dataApi';
import type { Debt } from '../store';
import type { SyncModule } from './types';

type DebtsSync = SyncModule<Debt, DebtDTO, CreateDebtInput, UpdateDebtInput> & {
  addPayment(serverId: string, body: { amount: number; date?: string }): Promise<DebtDTO>;
  archive(serverId: string): Promise<DebtDTO>;
};

export const debtsSync: DebtsSync = {
  domain: 'debts',

  toLocal(dto: DebtDTO): Debt {
    return {
      id: dto._id,
      direction: dto.direction,
      name: dto.name,
      color: dto.color ?? '#6B7280',
      amount: dto.amount,
      paid: dto.paid,
      due: dto.due,
      note: dto.note,
      created: dto.createdAt.slice(0, 10),
      payments: dto.payments.map((p) => ({
        id: p._id,
        amount: p.amount,
        date: p.date,
      })),
      archived: dto.archived,
    };
  },

  toCreate(local: Debt): CreateDebtInput {
    const input: CreateDebtInput = {
      direction: local.direction,
      name: local.name,
      amount: local.amount,
      due: local.due,
    };
    if (local.color !== undefined) input.color = local.color;
    if (local.note !== undefined) input.note = local.note;
    return input;
  },

  toUpdate(patch: Partial<Debt>): UpdateDebtInput {
    const update: UpdateDebtInput = {};
    if (patch.direction !== undefined) update.direction = patch.direction;
    if (patch.name !== undefined) update.name = patch.name;
    if (patch.color !== undefined) update.color = patch.color;
    if (patch.amount !== undefined) update.amount = patch.amount;
    if (patch.due !== undefined) update.due = patch.due;
    if (patch.note !== undefined) update.note = patch.note;
    return update;
  },

  async fetch(): Promise<Debt[]> {
    const [activeRes, archivedRes] = await Promise.all([
      debtsApi.list(),
      debtsApi.list({ archived: true }),
    ]);
    const all = [...activeRes.items, ...archivedRes.items];
    const seen = new Set<string>();
    const deduped: DebtDTO[] = [];
    for (const dto of all) {
      if (!seen.has(dto._id)) {
        seen.add(dto._id);
        deduped.push(dto);
      }
    }
    return deduped.map((dto) => this.toLocal(dto));
  },

  async create(local: Debt): Promise<DebtDTO> {
    const { item } = await debtsApi.create(this.toCreate(local));
    return item;
  },

  async update(serverId: string, patch: Partial<Debt>): Promise<DebtDTO> {
    const { item } = await debtsApi.update(serverId, this.toUpdate(patch));
    return item;
  },

  async remove(serverId: string): Promise<void> {
    await debtsApi.remove(serverId);
  },

  async addPayment(serverId: string, body: DebtPaymentInput): Promise<DebtDTO> {
    const { item } = await debtsApi.addPayment(serverId, body);
    return item;
  },

  async archive(serverId: string): Promise<DebtDTO> {
    const { item } = await debtsApi.archive(serverId);
    return item;
  },
};
