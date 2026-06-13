import type { Notif } from '@/lib/store';
import { notificationsApi, type NotificationDTO } from '@/lib/dataApi';

function toLocal(dto: NotificationDTO): Notif {
  return {
    id: dto._id,
    kind: dto.kind,
    title: { en: dto.title.en, uz: dto.title.uz },
    body: { en: dto.body.en, uz: dto.body.uz },
    date: dto.date,
    read: dto.read,
  };
}

export const notificationsSync = {
  domain: 'notifs' as const,

  toLocal,

  fetch: async (): Promise<Notif[]> => {
    const { items } = await notificationsApi.list();
    return items.map(toLocal);
  },

  markRead: async (serverId: string): Promise<void> => {
    await notificationsApi.markRead(serverId);
  },

  markAllRead: async (): Promise<void> => {
    await notificationsApi.markAllRead();
  },
};
