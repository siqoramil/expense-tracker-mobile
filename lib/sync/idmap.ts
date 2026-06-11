import AsyncStorage from '@react-native-async-storage/async-storage';
import type { IdMap } from './types';

const STORAGE_KEY = 'extracker:idmap';

// Per-domain: localId -> serverId
type MapStore = Record<string, Record<string, string>>;

let maps: MapStore = {};

const getOrCreate = (domain: string): Record<string, string> => {
  if (!maps[domain]) maps[domain] = {};
  return maps[domain];
};

export const idmap = {
  forDomain(domain: string): IdMap {
    return {
      toServer(localId: string): string | undefined {
        return getOrCreate(domain)[localId];
      },
      toLocalKnown(serverId: string): boolean {
        const m = getOrCreate(domain);
        return Object.values(m).includes(serverId);
      },
      link(localId: string, serverId: string): void {
        getOrCreate(domain)[localId] = serverId;
      },
      async persist(): Promise<void> {
        try {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(maps));
        } catch {}
      },
    };
  },

  async load(): Promise<void> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as MapStore;
        maps = parsed;
      }
    } catch {}
  },

  async clear(): Promise<void> {
    maps = {};
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {}
  },

  // Resolve a possibly-local id to its server id across all domains.
  // Returns the serverId if linked, or the original value if it already
  // looks like a server ObjectId (24-char hex) or has no mapping.
  resolve(domain: string, localOrServerId: string): string {
    const mapped = getOrCreate(domain)[localOrServerId];
    return mapped ?? localOrServerId;
  },
};
