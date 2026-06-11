// Shared contract for the server-sync layer. Each domain module under
// lib/sync/<domain>.ts implements SyncModule for its entity: pure mapping +
// dataApi calls, never importing store.ts. The glue (lib/sync/index.ts) wires
// these into the store with optimistic updates + id reconciliation.

// Bidirectional registry mapping client temp ids (e.g. 't1700…') to server
// ObjectIds, so children created before their parent's POST resolves can still
// be pushed with the right foreign keys.
export type IdMap = {
  toServer(localId: string): string | undefined;
  toLocalKnown(serverId: string): boolean;
  link(localId: string, serverId: string): void;
  persist(): Promise<void>;
};

export interface SyncModule<Local, Dto, CreateIn, UpdateIn> {
  // Stable key for this domain, also used as the IdMap namespace.
  domain: string;
  // server DTO -> State element (renames _id -> id, hydrates Localized, etc.)
  toLocal(dto: Dto): Local;
  // State element -> POST body (drops client-only fields, Localized -> {en,uz})
  toCreate(local: Local): CreateIn;
  // State patch -> PATCH body (strips computed/server-owned fields)
  toUpdate(patch: Partial<Local>): UpdateIn;
  // list() + map; used by the bootstrap fetch
  fetch(): Promise<Local[]>;
  create(local: Local): Promise<Dto>;
  update(serverId: string, patch: Partial<Local>): Promise<Dto>;
  remove(serverId: string): Promise<void>;
}
