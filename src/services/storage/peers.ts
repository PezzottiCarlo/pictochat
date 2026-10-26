import { withDb, type PeerRef } from './db';

export function loadPeerRefs(): Promise<PeerRef[]> {
  return withDb((db) => db.getAll('peers'), []);
}

export function savePeerRefs(refs: PeerRef[]): Promise<void> {
  if (!refs.length) return Promise.resolve();
  return withDb(async (db) => {
    const tx = db.transaction('peers', 'readwrite');
    await Promise.all(refs.map((r) => tx.store.put(r)));
    await tx.done;
  }, undefined);
}
