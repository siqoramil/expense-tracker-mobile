import type { SyncModule } from '@/lib/sync/types';
import type { Wallet } from '@/lib/store';
import { type CreateWalletInput, type UpdateWalletInput, type WalletDTO, walletsApi } from '@/lib/dataApi';

export const walletsSync: SyncModule<Wallet, WalletDTO, CreateWalletInput, UpdateWalletInput> = {
  domain: 'wallets',

  toLocal(dto: WalletDTO): Wallet {
    return {
      id: dto._id,
      name: { en: dto.name.en, uz: dto.name.uz },
      icon: dto.icon,
      color: dto.color,
      balance: dto.balance,
    };
  },

  toCreate(local: Wallet): CreateWalletInput {
    return {
      name: { en: local.name.en, uz: local.name.uz ?? local.name.en },
      icon: local.icon,
      color: local.color,
      balance: local.balance,
    };
  },

  toUpdate(patch: Partial<Wallet>): UpdateWalletInput {
    const result: UpdateWalletInput = {};
    if (patch.name !== undefined) {
      result.name = { en: patch.name.en, uz: patch.name.uz ?? patch.name.en };
    }
    if (patch.icon !== undefined) result.icon = patch.icon;
    if (patch.color !== undefined) result.color = patch.color;
    return result;
  },

  async fetch(): Promise<Wallet[]> {
    const { items } = await walletsApi.list();
    return items.map((dto) => walletsSync.toLocal(dto));
  },

  async create(local: Wallet): Promise<WalletDTO> {
    const { item } = await walletsApi.create(walletsSync.toCreate(local));
    return item;
  },

  async update(serverId: string, patch: Partial<Wallet>): Promise<WalletDTO> {
    const { item } = await walletsApi.update(serverId, walletsSync.toUpdate(patch));
    return item;
  },

  async remove(serverId: string): Promise<void> {
    await walletsApi.remove(serverId);
  },
};
