import { EX, Ex } from './library';
export { EX }; export type { Ex };
export const WORKOUTS: Record<'A' | 'B', string[][]> = {
  A: [['goblet', 'dbbench'], ['bbrow', 'dbpress'], ['plank']],
  B: [['rdl', 'incline'], ['split', 'dbrow'], ['deadbug']],
};
export type DayType = 'strength' | 'steady' | 'intervals' | 'easy' | 'rest';
export interface Day { type: DayType; title: string; sub: string; workout?: 'A' | 'B'; week: number; sets: number; deload: boolean; early: boolean }

const DAY = 864e5;
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const parse = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const monday = (d: Date) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };

export function planFor(dateIso: string, startIso: string, deloadEvery: number): Day {
  const d = parse(dateIso), w0 = monday(parse(startIso)), wm = monday(d);
  const weekIdx = Math.max(0, Math.round((wm.getTime() - w0.getTime()) / (7 * DAY)));
  const week = weekIdx + 1;
  const deload = deloadEvery > 0 && week % deloadEvery === 0;
  const early = week <= 2;
  const sets = early || deload ? 2 : 3;
  const dow = (d.getDay() + 6) % 7; // Mon=0
  const base = { week, sets, deload, early };
  if (dow === 0 || dow === 2 || dow === 4) {
    const n = weekIdx * 3 + dow / 2;
    const workout = n % 2 === 0 ? 'A' : 'B';
    return { ...base, type: 'strength', workout, title: `Strength ${workout}`, sub: `3 min bike warm-up · ${sets} sets · supersets` };
  }
  if (dow === 1) return { ...base, type: 'steady', title: 'Bike – steady', sub: early || deload ? '30 min easy – you can chat' : '30 min steady – you can still talk' };
  if (dow === 3) return early || deload
    ? { ...base, type: 'steady', title: 'Bike – easy', sub: `30 min easy (intervals start week 3${deload ? ' – deload week' : ''})` }
    : { ...base, type: 'intervals', title: 'Bike – intervals', sub: '5 min warm-up · 8 × 30 s hard / 90 s easy · cool-down' };
  if (dow === 5) return { ...base, type: 'easy', title: 'Easy day', sub: '30 min walk or light bike' };
  return { ...base, type: 'rest', title: 'Rest day', sub: 'Recover. Hit protein, sleep and steps.' };
}
export interface Phase { name: string; secs: number; hard?: boolean }
export function phasesFor(type: DayType | 'warmup'): Phase[] {
  if (type === 'intervals') {
    const p: Phase[] = [{ name: 'Warm-up', secs: 300 }];
    for (let i = 1; i <= 8; i++) { p.push({ name: `HARD ${i}/8`, secs: 30, hard: true }); p.push({ name: `Easy ${i}/8`, secs: 90 }); }
    p.push({ name: 'Cool-down', secs: 240 });
    return p;
  }
  if (type === 'warmup') return [{ name: 'Warm-up bike', secs: 180 }];
  return [{ name: type === 'easy' ? 'Walk / light bike' : 'Steady ride', secs: 1800 }];
}
export const e1rm = (w: number, r: number) => (r > 0 && w > 0 ? w * (1 + r / 30) : 0);
export const incFor = (e: Ex) => (e.equip === 'bb' ? 2.5 : e.equip === 'db' ? 2 : 0);
