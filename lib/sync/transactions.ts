import {
  transactionsApi,
  type TransactionDTO,
  type CreateTransactionInput,
  type UpdateTransactionInput,
} from '../dataApi';
import type { Transaction } from '../store';
import type { SyncModule } from './types';

export const transactionsSync: SyncModule<
  Transaction,
  TransactionDTO,
  CreateTransactionInput,
  UpdateTransactionInput
> = {
  domain: 'tx',

  toLocal(dto: TransactionDTO): Transaction {
    return {
      id: dto._id,
      kind: dto.kind,
      cat: dto.cat,
      wallet: dto.wallet,
      amount: dto.amount,
      note: dto.note,
      date: dto.date,
    };
  },

  toCreate(local: Transaction): CreateTransactionInput {
    return {
      kind: local.kind,
      cat: local.cat,
      wallet: local.wallet,
      amount: local.amount,
      note: local.note,
      date: local.date,
    };
  },

  toUpdate(patch: Partial<Transaction>): UpdateTransactionInput {
    const result: UpdateTransactionInput = {};
    if (patch.kind !== undefined) result.kind = patch.kind;
    if (patch.cat !== undefined) result.cat = patch.cat;
    if (patch.wallet !== undefined) result.wallet = patch.wallet;
    if (patch.amount !== undefined) result.amount = patch.amount;
    if (patch.note !== undefined) result.note = patch.note;
    if (patch.date !== undefined) result.date = patch.date;
    return result;
  },

  async fetch(): Promise<Transaction[]> {
    const { items } = await transactionsApi.list();
    return items.map((dto) => transactionsSync.toLocal(dto));
  },

  async create(local: Transaction): Promise<TransactionDTO> {
    const { item } = await transactionsApi.create(transactionsSync.toCreate(local));
    return item;
  },

  async update(serverId: string, patch: Partial<Transaction>): Promise<TransactionDTO> {
    const { item } = await transactionsApi.update(serverId, transactionsSync.toUpdate(patch));
    return item;
  },

  async remove(serverId: string): Promise<void> {
    await transactionsApi.remove(serverId);
  },
};
