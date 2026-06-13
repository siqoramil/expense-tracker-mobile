import type { Category } from '@/lib/store';
import type { SyncModule } from '@/lib/sync/types';
import { categoriesApi, type CategoryDTO, type CreateCategoryInput, type UpdateCategoryInput } from '@/lib/dataApi';

export const categoriesSync: SyncModule<
  Category,
  CategoryDTO,
  CreateCategoryInput,
  UpdateCategoryInput
> = {
  domain: 'categories',

  toLocal(dto: CategoryDTO): Category {
    return {
      id: dto._id,
      label: { en: dto.label.en, uz: dto.label.uz },
      icon: dto.icon,
      color: dto.color,
      kind: dto.kind,
    };
  },

  toCreate(local: Category): CreateCategoryInput {
    return {
      label: { en: local.label.en, uz: local.label.uz ?? local.label.en },
      icon: local.icon,
      color: local.color,
      kind: local.kind === 'subscription' ? 'expense' : local.kind,
    };
  },

  toUpdate(patch: Partial<Category>): UpdateCategoryInput {
    const result: UpdateCategoryInput = {};
    if (patch.label !== undefined) {
      result.label = { en: patch.label.en, uz: patch.label.uz ?? patch.label.en };
    }
    if (patch.icon !== undefined) result.icon = patch.icon;
    if (patch.color !== undefined) result.color = patch.color;
    if (patch.kind !== undefined) {
      result.kind = patch.kind === 'subscription' ? 'expense' : patch.kind;
    }
    return result;
  },

  async fetch(): Promise<Category[]> {
    const { items } = await categoriesApi.list();
    return items.map((dto) => categoriesSync.toLocal(dto));
  },

  async create(local: Category): Promise<CategoryDTO> {
    const { item } = await categoriesApi.create(categoriesSync.toCreate(local));
    return item;
  },

  async update(serverId: string, patch: Partial<Category>): Promise<CategoryDTO> {
    const { item } = await categoriesApi.update(serverId, categoriesSync.toUpdate(patch));
    return item;
  },

  async remove(serverId: string): Promise<void> {
    await categoriesApi.remove(serverId);
  },
};
