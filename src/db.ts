import { openDB } from 'idb';
export interface SetLog { w: number; r: number; done: boolean }
export interface Session { id: string; date: string; type: string; title: string; ex?: Record<string, SetLog[]>; order?: string[]; mins?: number; finished: number }
export interface Checkin { date: string; protein?: boolean; grams?: number; sleep?: number; steps?: number }
export interface Body { date: string; weight?: number; waist?: number }
export interface Settings { start: string; deloadEvery: number; scoop: number; rest: number; sound: boolean; rotate?: boolean; theme?: 'dark' | 'light' | 'auto' }
// v2: same stores; v1 data is kept as-is (new fields are optional). Settings get defaults merged on load.
const dbp = openDB('fit', 2, { upgrade(db, old) {
  if (old < 1) {
    db.createObjectStore('sessions', { keyPath: 'id' });
    db.createObjectStore('checkins', { keyPath: 'date' });
    db.createObjectStore('body', { keyPath: 'date' });
    db.createObjectStore('kv');
  }
} });
export const all = async <T>(s: string) => (await (await dbp).getAll(s)) as T[];
export const put = async (s: string, v: any, k?: string) => (await dbp).put(s, v, k);
export const get = async <T>(s: string, k: string) => (await (await dbp).get(s, k)) as T | undefined;
export const del = async (s: string, k: string) => (await dbp).delete(s, k);
export async function exportAll() {
  return { app: 'fit', v: 2, at: new Date().toISOString(), sessions: await all('sessions'), checkins: await all('checkins'), body: await all('body'), settings: await get('kv', 'settings') };
}
export async function importAll(j: any) {
  if (j?.app !== 'fit') throw new Error('Not a Fit backup');
  const db = await dbp;
  for (const s of ['sessions', 'checkins', 'body']) { const tx = db.transaction(s, 'readwrite'); await tx.store.clear(); for (const v of j[s] || []) await tx.store.put(v); await tx.done; }
  if (j.settings) await put('kv', j.settings, 'settings');
}
