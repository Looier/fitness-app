// Stick-figure pose system. Side view faces right. Angles in degrees.
// Limbs (a/e arm upper/fore, q/s thigh/shin): 0 = pointing down, +90 = forward (right), 180 = up, -90 = back.
// Torso t: 0 = upright, +90 = leaning forward flat, -90 = lying on back (head left).
type V = [number, number];
export interface P { t?: number; h?: number; a1?: number; e1?: number; a2?: number; e2?: number; q1?: number; s1?: number; q2?: number; s2?: number;
  f1?: number; f2?: number; u?: number; H?: number[]; A?: number[]; F1?: number[]; F2?: number[]; W1?: number[]; W2?: number[]; C?: number[] }
export interface Fig { k: P[]; v?: 'f'; eq?: string; pr?: (string | number)[][]; loop?: 1; d?: number; ra?: 1 }
const L = { t: 30, n: 11, hr: 6.5, a: 16, e: 15, q: 21, s: 20, f: 7 };
const FL = 93;
const rad = Math.PI / 180, dir = (a: number, l: number): V => [Math.sin(a * rad) * l, Math.cos(a * rad) * l];
const add = (p: V, q: V): V => [p[0] + q[0], p[1] + q[1]], sub = (p: V, q: V): V => [p[0] - q[0], p[1] - q[1]];
function ik(r: V, t: V, l1: number, l2: number, s: number): V {
  const dx = t[0] - r[0], dy = t[1] - r[1]; let d = Math.hypot(dx, dy); d = Math.min(Math.max(d, Math.abs(l1 - l2) + .01), l1 + l2 - .01);
  const b = Math.atan2(dy, dx), c = Math.acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d)), g = b + s * c;
  return [r[0] + Math.cos(g) * l1, r[1] + Math.sin(g) * l1];
}
const DEF: Required<Omit<P, 'H' | 'A' | 'F1' | 'F2' | 'W1' | 'W2' | 'C' | 'f1' | 'f2'>> = { t: 0, h: 0, a1: 4, e1: 4, a2: -4, e2: -4, q1: 0, s1: 0, q2: 0, s2: 0, u: 0 };
function lerpP(a: P, b: P, x: number): P {
  const o: any = {};
  for (const k of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const va: any = (a as any)[k] ?? (DEF as any)[k], vb: any = (b as any)[k] ?? (DEF as any)[k];
    if (Array.isArray(va) || Array.isArray(vb)) { const A = va || vb, B = vb || va; o[k] = A.map((v: number, i: number) => i === 2 && A.length === 3 ? v : v + (B[i] - v) * x); }
    else o[k] = va + (vb - va) * x;
  }
  return o;
}
interface J { hip: V; sh: V; head: V; el1: V; ha1: V; el2: V; ha2: V; kn1: V; an1: V; to1: V; kn2: V; an2: V; to2: V; sh1: V; sh2: V; hp1: V; hp2: V }
function solve(p0: P, f: Fig): J {
  const p = { ...DEF, ...p0 } as Required<P>, front = f.v === 'f', ra = f.ra ? p.t : 0;
  let F1 = p0.F1 as V | undefined, F2 = p0.F2 as V | undefined;
  if (p0.C) { const [cx, cy, r, ph] = p0.C; F1 = [cx + Math.cos(ph * rad) * r, cy + Math.sin(ph * rad) * r]; F2 = [cx - Math.cos(ph * rad) * r, cy - Math.sin(ph * rad) * r]; }
  const up = dir(180 - p.t, 1); // unit torso up = (sin t, -cos t)
  const perp: V = [-up[1], up[0]];
  const hw = front ? 5 : 0, sw = front ? 9 : 0;
  let hip: V;
  if (p0.H) hip = p0.H as V;
  else { const A = (p0.A || [56, 90]) as V; hip = sub(sub(A, dir(p.s1, L.s)), dir(p.q1, L.q)); if (front) hip = sub(hip, [perp[0] * hw, perp[1] * hw]); }
  const sh: V = add(hip, [up[0] * L.t, up[1] * L.t - p.u * 0]);
  const shl: V = [sh[0], sh[1] - p.u];
  const head = add(sh, dir(180 - p.t - p.h, L.n));
  const sh1 = add(shl, [perp[0] * sw, perp[1] * sw]), sh2 = sub(shl, [perp[0] * sw, perp[1] * sw]);
  const hp1 = add(hip, [perp[0] * hw, perp[1] * hw]), hp2 = sub(hip, [perp[0] * hw, perp[1] * hw]);
  const arm = (s: V, a: number, e: number, W?: number[]): [V, V] => {
    if (W) { const el = ik(s, W as V, L.a, L.e, (W[2] ?? 1)); return [el, W as V]; }
    const el = add(s, dir(a + ra, L.a)); return [el, add(el, dir(e + ra, L.e))];
  };
  const leg = (h: V, q: number, sN: number, F?: number[]): [V, V] => {
    if (F) { const kn = ik(h, F as V, L.q, L.s, (F[2] ?? -1)); return [kn, F as V]; }
    const kn = add(h, dir(q, L.q)); return [kn, add(kn, dir(sN, L.s))];
  };
  const [el1, ha1] = arm(sh1, p.a1, p.e1, p0.W1), [el2, ha2] = arm(sh2, p.a2, p.e2, p0.W2);
  const [kn1, an1] = leg(hp1, p.q1, p.s1, F1), [kn2, an2] = leg(hp2, p.q2, p.s2, F2);
  const footA = (sN: number, kn: V, an: V, ov: number | undefined, side: number) => {
    if (ov !== undefined) return ov;
    if (front) return side * 90;
    const sa = Math.atan2(an[0] - kn[0], an[1] - kn[1]) / rad;
    return Math.abs(sa) < 60 ? 90 : sa + 90;
  };
  const to1 = add(an1, dir(footA(p.s1, kn1, an1, p0.f1, 1), front ? 4 : L.f)), to2 = add(an2, dir(footA(p.s2, kn2, an2, p0.f2, -1), front ? 4 : L.f));
  return { hip, sh: shl, head, el1, ha1, el2, ha2, kn1, an1, to1, kn2, an2, to2, sh1, sh2, hp1, hp2 };
}
const pl = (...p: V[]) => `M${p.map(q => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L')}`;
const db = (c: V, s = 1) => `<g class="fe" transform="translate(${c[0].toFixed(1)} ${c[1].toFixed(1)}) scale(${s})"><rect x="-6" y="-1.3" width="12" height="2.6" rx="1"/><rect x="-7.5" y="-4.5" width="3.6" height="9" rx="1.2"/><rect x="3.9" y="-4.5" width="3.6" height="9" rx="1.2"/></g>`;
const plate = (c: V) => `<g class="fe"><circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="8.5" class="pl"/><circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="1.8"/></g>`;
const mid = (a: V, b: V): V => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
function props(f: Fig) {
  let s = `<line class="fl" x1="-4" y1="${FL + 2.5}" x2="124" y2="${FL + 2.5}"/>`;
  for (const p of f.pr || []) {
    const [k, a, b, c, d] = p as [string, number, number, number, number];
    if (k === 'b') s += `<g class="fp"><rect x="${a}" y="${b}" width="${c}" height="4" rx="2"/><rect x="${a + 4}" y="${b + 4}" width="3" height="${FL + 2.5 - b - 4}"/><rect x="${a + c - 7}" y="${b + 4}" width="3" height="${FL + 2.5 - b - 4}"/></g>`;
    if (k === 'i') { const e = add([a, b], dir(180 - c, d)); s += `<g class="fp"><path d="${pl([a, b], e)}" class="fpl"/><path d="${pl([a, b], [a, FL + 2.5])}M${a - 12} ${b}L${a + 4} ${b}" class="fpt"/></g>`; }
    if (k === 's') s += `<g class="fp"><rect x="${a}" y="${b}" width="${c}" height="${FL + 2.5 - b}" rx="2"/></g>`;
    if (k === 'w') s += `<g class="fp"><rect x="${a - 4}" y="-14" width="4" height="${FL + 16.5}"/></g>`;
    if (k === 'k') s += `<g class="fp"><path class="fpl" d="M52 60L52 62L64 86M40 95L64 86L92 95M64 86L84 52M78 49L90 47M44 58L60 58"/><circle cx="66" cy="80" r="11" class="fw"/></g>`;
  }
  return s;
}
function draw(f: Fig, p: P) {
  const j = solve(p, f);
  const limb = (a: V, b: V, c: V, d: V) => pl(a, b, c, d);
  let s = `<g class="far"><path d="${limb(j.sh2, j.el2, j.ha2, j.ha2)}"/><path d="${limb(j.hp2, j.kn2, j.an2, j.to2)}"/></g>`;
  const torso = f.v === 'f' ? pl(j.sh2, j.sh1) + pl(j.hp2, j.hp1) + pl(j.hip, j.sh) : pl(j.hip, j.sh);
  s += `<g class="near"><path d="${torso}"/><path d="${pl(j.sh, add(j.sh, sub(j.head, j.sh).map(v => v * .45) as V))}"/><path d="${limb(j.hp1, j.kn1, j.an1, j.to1)}"/><path d="${limb(j.sh1, j.el1, j.ha1, j.ha1)}"/></g>`;
  s += `<circle class="fhd" cx="${j.head[0].toFixed(1)}" cy="${j.head[1].toFixed(1)}" r="${L.hr}"/>`;
  const eq = f.eq || '';
  if (eq === 'db2') s += db(j.ha2, .9) + db(j.ha1);
  if (eq === 'db1') s += db(j.ha1);
  if (eq === 'gob') s += db(mid(j.ha1, j.ha2), 1.05);
  if (eq === 'bb') s += plate(j.ha1);
  if (eq === 'bbs') s += plate(add(j.sh, dir(180 - (p.t || 0) - 75, 4)));
  if (eq === 'bbf') s += plate(add(j.sh, dir(180 - (p.t || 0) + 90, 5)));
  if (eq === 'bbh') s += plate([j.hip[0], j.hip[1] - 8]);
  if (eq === 'dbh') s += db([j.hip[0], j.hip[1] - 5]);
  if (eq === 'dbk') s += db([j.kn1[0] - 4, j.kn1[1] - 5]);
  return s;
}
const ease = (x: number) => x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2;
export function poseAt(f: Fig, ms: number): P {
  const k = f.k, n = k.length; if (n === 1) return k[0];
  const d = (f.d || 1) * 1000;
  if (f.loop) { const T = d * n, x = (ms % T) / d, i = Math.floor(x); return lerpP(k[i], k[(i + 1) % n], f.k.length > 2 && !f.k[0].C ? ease(x - i) : x - i); }
  const hold = 300, T = 2 * (d + hold) * (n - 1) / (n - 1) * (n - 1); let x = ms % T;
  const seg = d + hold, legs = (n - 1) * 2, i = Math.floor(x / seg) % legs, r = Math.min(1, (x - i * seg) / d);
  const fwd = i < n - 1, a = fwd ? i : legs - i, b = fwd ? i + 1 : legs - i - 1;
  return lerpP(k[a], k[b], ease(r));
}
export const figInner = (id: string, which: number | 'mid' = 0) => { const f = FIG[id]; if (!f) return ''; return props(f) + draw(f, which === 'mid' ? lerpP(f.k[0], f.k[Math.min(1, f.k.length - 1)], .5) : f.k[Math.min(which, f.k.length - 1)]); };
export const figFrame = (id: string, ms: number) => { const f = FIG[id]; return f ? props(f) + draw(f, poseAt(f, ms)) : ''; };
export const VB = '-6 -16 132 114';
export const hasFig = (id: string) => !!FIG[id];
export const figCount = (id: string) => FIG[id]?.k.length || 0;

// ---------- pose data
const sq = (t = 40, q = 82, s = -30): P => ({ t, q1: q, s1: s, q2: q - 3, s2: s + 2 });
const hang: P = { a1: 0, e1: 0, a2: 0, e2: 0 };
const LY = (x = 66, y = 63): P => ({ H: [x, y], t: -90, F1: [86, 90], F2: [81, 90] });
const BENCH = ['b', 20, 67, 58];
const WALK: P[] = [
  { H: [60, 50], q1: 24, s1: 14, q2: -18, s2: -30, a1: -22, e1: -10, a2: 22, e2: 40 },
  { H: [60, 49], q1: 2, s1: -4, q2: 14, s2: -55, a1: 0, e1: 6, a2: 0, e2: 6 },
  { H: [60, 50], q2: 24, s2: 14, q1: -18, s1: -30, a2: -22, e2: -10, a1: 22, e1: 40 },
  { H: [60, 49], q2: 2, s2: -4, q1: 14, s1: -55, a2: 0, e2: 6, a1: 0, e1: 6 }];
const WALKD = WALK.map(p => ({ ...p, a1: (p.a1! / 3), e1: p.a1! / 3, a2: p.a2! / 3, e2: p.a2! / 3 }));
const BIKE = (sp = 1.2): Fig => ({ pr: [['k']], loop: 1, d: sp, k: [0, 90, 180, 270].map(ph => ({ H: [50, 56], t: 38, h: -18, W1: [86, 48, 1], W2: [84, 48, 1], C: [64, 86, 9, ph] } as P)).map((p, i, a) => p) });
const lunge = (front = 74): P[] => [
  { A: [front - 12, 90], ...hang, q1: 0, s1: 0, q2: 0, s2: 0 },
  { A: [front, 90], ...hang, q1: 82, s1: -6, q2: -6, s2: -98, f2: 30 }];
export const FIG: Record<string, Fig> = {
  goblet: { eq: 'gob', ra: 1, k: [{ a1: 22, e1: 168, a2: 26, e2: 168 }, { ...sq(), a1: 8, e1: 145, a2: 12, e2: 145 }] },
  bbsquat: { eq: 'bbs', ra: 1, k: [{ a1: -45, e1: 165, a2: -40, e2: 165 }, { ...sq(45, 86, -28), a1: -45, e1: 165, a2: -40, e2: 165 }] },
  frontsq: { eq: 'bbf', ra: 1, k: [{ a1: 95, e1: -100, a2: 92, e2: -100 }, { ...sq(18, 88, -38), a1: 95, e1: -100, a2: 92, e2: -100 }] },
  dbsquat: { eq: 'db2', k: [{ ...hang }, { ...sq(35), ...hang }] },
  bwsquat: { k: [{ a1: 10, e1: 10, a2: 8, e2: 8 }, { ...sq(38), a1: 90, e1: 90, a2: 88, e2: 88 }] },
  split: { eq: 'db2', k: [{ A: [72, 90], ...hang, q1: 22, s1: 2, q2: -28, s2: -30, f2: 35 }, { A: [72, 90], ...hang, q1: 82, s1: -6, q2: -4, s2: -98, f2: 30 }] },
  bulgarian: { eq: 'db2', pr: [['b', 6, 70, 30]], k: [{ A: [76, 90], ...hang, q1: 18, s1: 0, F2: [30, 66, -1] }, { A: [76, 90], ...hang, q1: 80, s1: -10, F2: [30, 66, -1] }] },
  revlunge: { eq: 'db2', k: lunge(66) },
  walklunge: { eq: 'db2', k: lunge(78) },
  stepup: { eq: 'db2', pr: [['s', 62, 70, 34]], k: [{ H: [52, 52], t: 12, ...hang, F1: [70, 68], F2: [50, 90] }, { H: [72, 30], t: 0, ...hang, F1: [74, 68], F2: [64, 58] }] },
  rdl: { eq: 'bb', k: [{ ...hang, q1: 4, s1: -4, q2: 4, s2: -4 }, { t: 74, h: -10, ...hang, q1: 14, s1: -14, q2: 12, s2: -12 }] },
  dbrdl: { eq: 'db2', k: [{ ...hang, q1: 4, s1: -4, q2: 4, s2: -4 }, { t: 74, h: -10, ...hang, q1: 14, s1: -14, q2: 12, s2: -12 }] },
  deadlift: { eq: 'bb', k: [{ t: 58, h: -15, ...hang, q1: 70, s1: -22, q2: 68, s2: -20 }, { ...hang }] },
  sldl: { eq: 'db1', k: [{ ...hang, q2: -8, s2: -14 }, { t: 78, h: -10, ...hang, q1: 8, s1: -8, q2: -82, s2: -82 }] },
  hipthrust: { eq: 'bbh', pr: [['b', 4, 66, 34]], k: [{ H: [63, 82], t: -47, h: 25, W1: [62, 72, -1], W2: [60, 72, -1], F1: [86, 90], F2: [82, 90] }, { H: [70, 62], t: -90, h: 35, W1: [70, 54, -1], W2: [68, 54, -1], F1: [86, 90], F2: [82, 90] }] },
  dbthrust: { eq: 'dbh', pr: [['b', 4, 66, 34]], k: [{ H: [63, 82], t: -47, h: 25, W1: [62, 76, -1], W2: [60, 76, -1], F1: [86, 90], F2: [82, 90] }, { H: [70, 62], t: -90, h: 35, W1: [70, 57, -1], W2: [68, 57, -1], F1: [86, 90], F2: [82, 90] }] },
  glutebridge: { k: [{ H: [64, 87], t: -90, W1: [60, 90, -1], W2: [56, 90, -1], F1: [86, 90], F2: [82, 90] }, { H: [62, 72], t: -118, h: 30, W1: [52, 90, -1], W2: [48, 90, -1], F1: [86, 90], F2: [82, 90] }] },
  calf: { eq: 'db2', pr: [['s', 44, 88, 30]], k: [{ A: [58, 84], ...hang, f1: 95, f2: 95 }, { A: [58, 78], ...hang, f1: 35, f2: 35 }] },
  seatcalf: { eq: 'dbk', pr: [['b', 22, 68, 34]], k: [{ H: [46, 64], W1: [66, 60, -1], W2: [64, 60, -1], F1: [70, 87], F2: [67, 87], f1: 95, f2: 95 }, { H: [46, 64], W1: [66, 56, -1], W2: [64, 56, -1], F1: [70, 82], F2: [67, 82], f1: 35, f2: 35 }] },
  wallsit: { pr: [['w', 33]], k: [{ H: [38, 68], ...hang, a1: 30, e1: 90, a2: 30, e2: 90, F1: [60, 90], F2: [57, 90] }, { H: [38, 67], a1: 30, e1: 90, a2: 30, e2: 90, F1: [60, 90], F2: [57, 90] }] },
  dbbench: { eq: 'db2', pr: [BENCH], k: [{ ...LY(), a1: 180, e1: 180, a2: 178, e2: 178 }, { ...LY(), a1: 80, e1: 176, a2: 78, e2: 176 }] },
  bbbench: { eq: 'bb', pr: [BENCH], k: [{ ...LY(), a1: 172, e1: 180, a2: 170, e2: 178 }, { ...LY(), a1: 70, e1: 160, a2: 68, e2: 160 }] },
  closebench: { eq: 'bb', pr: [BENCH], k: [{ ...LY(), a1: 175, e1: 180, a2: 173, e2: 178 }, { ...LY(), a1: 50, e1: 150, a2: 48, e2: 150 }] },
  incline: { eq: 'db2', pr: [['i', 64, 70, -58, 40], ['s', 54, 70, 12]], k: [{ H: [62, 64], t: -58, a1: 175, e1: 175, a2: 173, e2: 173, F1: [88, 90], F2: [84, 90] }, { H: [62, 64], t: -58, a1: 70, e1: 170, a2: 68, e2: 170, F1: [88, 90], F2: [84, 90] }] },
  inclinebb: { eq: 'bb', pr: [['i', 64, 70, -58, 40], ['s', 54, 70, 12]], k: [{ H: [62, 64], t: -58, a1: 170, e1: 175, a2: 168, e2: 173, F1: [88, 90], F2: [84, 90] }, { H: [62, 64], t: -58, a1: 65, e1: 160, a2: 63, e2: 160, F1: [88, 90], F2: [84, 90] }] },
  dbfly: { eq: 'db2', pr: [BENCH], k: [{ ...LY(), a1: 180, e1: 175, a2: 178, e2: 173 }, { ...LY(), a1: 100, e1: 120, a2: 260, e2: 235 }] },
  pushup: { k: [{ A: [20, 86], f1: 10, f2: 10, t: 65, q1: -65, s1: -65, q2: -65, s2: -65, W1: [87, 90, -1], W2: [84, 90, -1] }, { A: [20, 86], f1: 10, f2: 10, t: 81, q1: -81, s1: -81, q2: -81, s2: -81, W1: [87, 90, -1], W2: [84, 90, -1] }] },
  inclpush: { pr: [['b', 78, 66, 36]], k: [{ A: [18, 86], f1: 10, f2: 10, t: 52, q1: -52, s1: -52, q2: -52, s2: -52, W1: [88, 65, -1], W2: [85, 65, -1] }, { A: [18, 86], f1: 10, f2: 10, t: 66, q1: -66, s1: -66, q2: -66, s2: -66, W1: [88, 65, -1], W2: [85, 65, -1] }] },
  declpush: { pr: [['b', 0, 64, 30]], k: [{ A: [18, 60], f1: 10, f2: 10, t: 90, q1: -90, s1: -90, q2: -90, s2: -90, W1: [89, 90, -1], W2: [86, 90, -1] }, { A: [18, 60], f1: 10, f2: 10, t: 104, q1: -104, s1: -104, q2: -104, s2: -104, W1: [89, 90, -1], W2: [86, 90, -1] }] },
  floorpress: { eq: 'db2', k: [{ H: [66, 87], t: -90, a1: 180, e1: 180, a2: 178, e2: 178, F1: [86, 90], F2: [82, 90] }, { H: [66, 87], t: -90, a1: 92, e1: 180, a2: 90, e2: 178, F1: [86, 90], F2: [82, 90] }] },
  bbrow: { eq: 'bb', k: [{ t: 58, h: -10, ...hang, q1: 16, s1: -14, q2: 14, s2: -12 }, { t: 58, h: -10, a1: -70, e1: 10, a2: -68, e2: 10, q1: 16, s1: -14, q2: 14, s2: -12 }] },
  pendlay: { eq: 'bb', k: [{ t: 84, h: -20, ...hang, q1: 30, s1: -24, q2: 28, s2: -22 }, { t: 84, h: -20, a1: -90, e1: 20, a2: -88, e2: 20, q1: 30, s1: -24, q2: 28, s2: -22 }] },
  dbrow: { eq: 'db1', pr: [['b', 24, 66, 72]], k: [{ H: [48, 45], t: 82, h: -15, a1: 0, e1: 0, W2: [86, 64, -1], q2: 0, s2: -90, F1: [40, 90] }, { H: [48, 45], t: 82, h: -15, a1: -80, e1: 0, W2: [86, 64, -1], q2: 0, s2: -90, F1: [40, 90] }] },
  chestrow: { eq: 'db2', pr: [['i', 46, 80, 48, 42], ['s', 36, 80, 14]], k: [{ H: [46, 72], t: 48, h: -10, ...hang, F1: [28, 90, -1], F2: [24, 90, -1], f1: 20, f2: 20 }, { H: [46, 72], t: 48, h: -10, a1: -60, e1: 10, a2: -58, e2: 10, F1: [28, 90, -1], F2: [24, 90, -1], f1: 20, f2: 20 }] },
  shrug: { eq: 'db2', v: 'f', k: [{ a1: 6, e1: 6, a2: -6, e2: -6, q1: 4, s1: 4, q2: -4, s2: -4 }, { u: 6, a1: 6, e1: 6, a2: -6, e2: -6, q1: 4, s1: 4, q2: -4, s2: -4 }] },
  pullover: { eq: 'gob', pr: [BENCH], k: [{ ...LY(), a1: 178, e1: 178, a2: 176, e2: 176 }, { ...LY(), a1: -102, e1: -102, a2: -100, e2: -100 }] },
  revfly: { eq: 'db2', v: 'f', k: [{ A: [62, 90], ...hang, a1: 4, e1: 4, a2: -4, e2: -4, q1: 6, s1: -2, q2: -6, s2: 2, t: 0, h: 0 }, { A: [62, 90], a1: 85, e1: 90, a2: -85, e2: -90, q1: 6, s1: -2, q2: -6, s2: 2 }] },
  superman: { k: [{ H: [56, 87], t: 90, a1: 92, e1: 92, a2: 92, e2: 92, q1: -90, s1: -90, q2: -90, s2: -90 }, { H: [56, 88], t: 100, h: -15, a1: 110, e1: 112, a2: 110, e2: 112, q1: -102, s1: -104, q2: -102, s2: -104 }] },
  dbpress: { eq: 'db2', k: [{ a1: 40, e1: 172, a2: 38, e2: 170 }, { a1: 176, e1: 180, a2: 174, e2: 178 }] },
  ohp: { eq: 'bb', k: [{ a1: 50, e1: 170, a2: 48, e2: 168 }, { a1: 172, e1: 176, a2: 170, e2: 174 }] },
  arnold: { eq: 'db2', k: [{ a1: 82, e1: 196, a2: 80, e2: 194 }, { a1: 176, e1: 180, a2: 174, e2: 178 }] },
  latraise: { eq: 'db2', v: 'f', k: [{ a1: 10, e1: 12, a2: -10, e2: -12 }, { a1: 86, e1: 92, a2: -86, e2: -92 }] },
  frontraise: { eq: 'db2', k: [{ ...hang }, { a1: 92, e1: 95, a2: 6, e2: 6 }] },
  uprow: { eq: 'db2', v: 'f', k: [{ a1: -8, e1: -12, a2: 8, e2: 12 }, { a1: 105, e1: -40, a2: -105, e2: 40 }] },
  pikepush: { k: [{ A: [30, 86], f1: 10, f2: 10, q1: -15, s1: -15, q2: -15, s2: -15, t: 125, h: -20, W1: [78, 90, -1], W2: [75, 90, -1] }, { A: [30, 86], f1: 10, f2: 10, q1: -25, s1: -25, q2: -25, s2: -25, t: 135, h: -20, W1: [78, 90, -1], W2: [75, 90, -1] }] },
  curl: { eq: 'db2', k: [{ a1: 2, e1: 4, a2: 0, e2: 2 }, { a1: 12, e1: 160, a2: 10, e2: 158 }] },
  hammer: { eq: 'db2', k: [{ a1: 2, e1: 4, a2: 0, e2: 2 }, { a1: 12, e1: 160, a2: 10, e2: 158 }] },
  bbcurl: { eq: 'bb', k: [{ a1: 2, e1: 6, a2: 0, e2: 4 }, { a1: 12, e1: 162, a2: 10, e2: 160 }] },
  inclcurl: { eq: 'db2', pr: [['i', 56, 70, -32, 40], ['s', 46, 70, 12]], k: [{ H: [54, 64], t: -32, a1: -6, e1: -4, a2: -8, e2: -6, F1: [84, 90], F2: [80, 90] }, { H: [54, 64], t: -32, a1: -2, e1: 150, a2: -4, e2: 148, F1: [84, 90], F2: [80, 90] }] },
  skull: { eq: 'db2', pr: [BENCH], k: [{ ...LY(), a1: 168, e1: 172, a2: 166, e2: 170 }, { ...LY(), a1: 165, e1: -80, a2: 163, e2: -82 }] },
  ohext: { eq: 'gob', k: [{ a1: 172, e1: 178, a2: 170, e2: 176 }, { a1: 168, e1: -20, a2: 166, e2: -22 }] },
  kickback: { eq: 'db1', k: [{ t: 70, h: -10, a1: -75, e1: 0, a2: 0, e2: 0, q1: 16, s1: -12, q2: 14, s2: -10 }, { t: 70, h: -10, a1: -78, e1: -78, a2: 0, e2: 0, q1: 16, s1: -12, q2: 14, s2: -10 }] },
  benchdip: { pr: [['b', 14, 64, 36]], k: [{ H: [56, 58], W1: [48, 63, 1], W2: [46, 63, 1], F1: [96, 90, -1], F2: [93, 90, -1] }, { H: [56, 76], W1: [48, 63, 1], W2: [46, 63, 1], F1: [96, 90, -1], F2: [93, 90, -1] }] },
  plank: { d: 1.6, k: [{ A: [20, 86], f1: 10, f2: 10, t: 79, q1: -79, s1: -79, q2: -79, s2: -79, a1: 0, e1: 90, a2: 0, e2: 90 }, { A: [20, 86], f1: 10, f2: 10, t: 78, q1: -78, s1: -78, q2: -78, s2: -78, a1: 2, e1: 90, a2: 2, e2: 90 }] },
  sideplank: { v: 'f', d: 1.6, k: [{ A: [24, 88], f1: 90, f2: 90, t: 72, q1: -72, s1: -72, q2: -72, s2: -72, a1: 0, e1: 90, a2: 180, e2: 180 }, { A: [24, 88], f1: 90, f2: 90, t: 70, q1: -70, s1: -70, q2: -70, s2: -70, a1: 2, e1: 90, a2: 180, e2: 180 }] },
  deadbug: { k: [{ H: [64, 87], t: -90, a1: 180, e1: 180, a2: 178, e2: 178, q1: 180, s1: 90, q2: 178, s2: 90 }, { H: [64, 87], t: -90, a1: 180, e1: 180, a2: -96, e2: -96, q1: 96, s1: 96, q2: 178, s2: 90 }] },
  crunch: { ra: 1, k: [{ H: [64, 87], t: -90, a1: 150, e1: -40, a2: 148, e2: -40, F1: [86, 90], F2: [82, 90] }, { H: [64, 87], t: -55, h: 15, a1: 150, e1: -40, a2: 148, e2: -40, F1: [86, 90], F2: [82, 90] }] },
  legraise: { pr: [BENCH], k: [{ H: [66, 63], t: -90, W1: [24, 66, 1], W2: [26, 66, 1], q1: 96, s1: 96, q2: 94, s2: 94 }, { H: [66, 63], t: -90, W1: [24, 66, 1], W2: [26, 66, 1], q1: 175, s1: 175, q2: 173, s2: 173 }] },
  russian: { eq: 'gob', k: [{ H: [56, 87], t: -38, h: 10, a1: 110, e1: 130, a2: 100, e2: 120, q1: 128, s1: 50, q2: 124, s2: 48 }, { H: [56, 87], t: -38, h: 10, a1: 40, e1: 70, a2: 30, e2: 60, q1: 128, s1: 50, q2: 124, s2: 48 }] },
  mountain: { d: .45, k: [{ H: [54, 66], t: 70, W1: [86, 90, -1], W2: [83, 90, -1], F1: [70, 86, -1], F2: [20, 89, -1], f1: 30, f2: 10 }, { H: [54, 66], t: 70, W1: [86, 90, -1], W2: [83, 90, -1], F2: [70, 86, -1], F1: [20, 89, -1], f2: 30, f1: 10 }] },
  birddog: { k: [{ H: [48, 67], t: 90, h: -10, W1: [78, 90, -1], W2: [76, 90, -1], q1: 0, s1: -90, q2: 0, s2: -90 }, { H: [48, 67], t: 90, h: -10, a1: 175, e1: 175, W2: [76, 90, -1], q1: 0, s1: -90, q2: -92, s2: -92, f2: -90 }] },
  hollow: { d: 1.6, k: [{ H: [60, 86], t: -108, h: 20, a1: -110, e1: -110, a2: -108, e2: -108, q1: 100, s1: 100, q2: 98, s2: 98 }, { H: [60, 86], t: -106, h: 20, a1: -108, e1: -108, a2: -106, e2: -106, q1: 101, s1: 101, q2: 99, s2: 99 }] },
  abroll: { eq: 'bb', k: [{ H: [44, 64], t: 28, h: -10, W1: [60, 82, -1], W2: [58, 82, -1], q1: 0, s1: -90, q2: 0, s2: -90 }, { H: [50, 74], t: 74, h: -10, W1: [96, 82, -1], W2: [94, 82, -1], q1: 50, s1: -90, q2: 50, s2: -90 }] },
  farmer: { eq: 'db2', loop: 1, d: .5, k: WALKD.map(p => ({ ...p, ...hang })) },
  suitcase: { eq: 'db1', v: 'f', d: 1.4, k: [{ a1: 2, e1: 2, a2: -12, e2: -12, q1: 4, s1: 4, q2: -4, s2: -4 }, { a1: 2, e1: 2, a2: -12, e2: -12, q1: 4, s1: 4, q2: -4, s2: -4, h: 0, t: 1 }] },
  thruster: { eq: 'db2', ra: 1, k: [{ ...sq(30), a1: 30, e1: 175, a2: 28, e2: 173 }, { a1: 176, e1: 180, a2: 174, e2: 178 }] },
  dbswing: { eq: 'gob', d: .7, k: [{ t: 62, h: -15, a1: -40, e1: -40, a2: -38, e2: -38, q1: 24, s1: -20, q2: 22, s2: -18 }, { a1: 92, e1: 92, a2: 90, e2: 90 }] },
  burpee: { loop: 1, d: .55, k: [
    { H: [56, 49.2], t: 0, a1: 4, e1: 4, a2: 2, e2: 2, F1: [58, 90], F2: [55, 90] },
    { H: [48, 70], t: 55, h: -15, W1: [76, 90, -1], W2: [73, 90, -1], F1: [60, 90], F2: [57, 90] },
    { H: [50, 71], t: 76, h: -10, W1: [79, 90, -1], W2: [76, 90, -1], F1: [12, 88], F2: [9, 88], f1: 10, f2: 10 },
    { H: [48, 70], t: 55, h: -15, W1: [76, 90, -1], W2: [73, 90, -1], F1: [60, 90], F2: [57, 90] },
    { H: [56, 41.2], t: 0, a1: 178, e1: 178, a2: 176, e2: 176, F1: [57, 82], F2: [54, 82] }] },
  clean: { eq: 'db2', ra: 1, loop: 1, d: .8, k: [
    { t: 24, h: -8, a1: -24, e1: -24, a2: -26, e2: -26, q1: 22, s1: -18, q2: 20, s2: -16 },
    { a1: 30, e1: 172, a2: 28, e2: 170, q1: 10, s1: -10, q2: 8, s2: -8 },
    { a1: 176, e1: 180, a2: 174, e2: 178 },
    { a1: 30, e1: 172, a2: 28, e2: 170 }] },
  bikeint: BIKE(.45), bikesteady: BIKE(.9), biketempo: BIKE(.6), biketabata: BIKE(.35),
  walk: { loop: 1, d: .5, k: WALK },
  brisk: { loop: 1, d: .38, k: WALK.map(p => ({ ...p, t: 8 })) },
};
FIG.hammer = { ...FIG.curl };
