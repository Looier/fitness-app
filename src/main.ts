import './style.css';
import { WORKOUTS, planFor, phasesFor, iso, parse, e1rm, incFor, Day, Phase } from './program';
import { EX, LIB, MUSCLES, forMuscle, altsFor, ROTATE, isLoad, Ex, Muscle } from './library';
import { I, ring, rings3, empty, DEFS, MC } from './ui';
import { all, put, get, del, exportAll, importAll, Session, Checkin, Body, Settings, SetLog } from './db';

const VERSION = '2.1';
const app = document.getElementById('app')!;
const $ = (s: string) => app.querySelector(s) as HTMLElement;
const today = () => iso(new Date());
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;
const nice = (d: string) => parse(d).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
const esc = (s: string) => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
const daysAgo = (d: string) => Math.round((parse(today()).getTime() - parse(d).getTime()) / 864e5);
const ago = (d: string) => { const n = daysAgo(d); return n <= 0 ? 'today' : n === 1 ? 'yesterday' : `${n} days ago`; };
const MN = Object.fromEntries(MUSCLES) as Record<Muscle, string>;

let S = {} as Settings; let sessions: Session[] = []; let checkins: Record<string, Checkin> = {}; let body: Body[] = [];
type Tab = 'today' | 'log' | 'lib' | 'progress' | 'settings';
let tab: Tab = 'today';
let mode: 'tabs' | 'runner' | 'timer' | 'quick' | 'detail' = 'tabs';
interface Draft { date: string; workout: 'A' | 'B'; title: string; ex: Record<string, SetLog[]>; hints: Record<string, string>; started: number; groups?: string[][] }
interface Quick { title: string; ex: Record<string, SetLog[]>; order: string[]; started: number; q: string }
let draft: Draft | null = null; let Q: Quick | null = null;
let restEnd = 0; let progEx = 'goblet'; let swapFor: string | null = null;
let libM: Muscle | null = null; let libQ = ''; let detailId = 'goblet'; let detailBack: typeof mode = 'tabs';

// ---------- sound / vibrate / wake lock / toast ----------
let ac: AudioContext | null = null;
function beep(f = 880, ms = 180, n = 1) {
  if (S.sound) try {
    ac ??= new AudioContext();
    for (let i = 0; i < n; i++) { const o = ac.createOscillator(), g = ac.createGain(); const t = ac.currentTime + i * (ms / 1000 + 0.08);
      o.frequency.value = f; g.gain.setValueAtTime(0.35, t); g.gain.exponentialRampToValueAtTime(0.001, t + ms / 1000); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + ms / 1000); }
  } catch {}
  navigator.vibrate?.(n > 1 ? [200, 100, 200] : 150);
}
let lock: any = null;
async function wake(on: boolean) { try { if (on && !lock) { lock = await (navigator as any).wakeLock?.request('screen'); lock?.addEventListener('release', () => (lock = null)); } else if (!on) { await lock?.release(); lock = null; } } catch {} }
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && (mode === 'timer' || mode === 'runner' || mode === 'quick')) wake(true); });
let toastT: number | undefined;
function toast(m: string, undo?: () => void) {
  let t = document.getElementById('toast'); if (!t) { t = document.createElement('div'); t.id = 'toast'; document.body.append(t); }
  t.innerHTML = esc(m) + (undo ? ' <button id="undo">Undo</button>' : ''); t.classList.add('show');
  if (undo) t.querySelector('#undo')!.addEventListener('click', () => { undo(); t!.classList.remove('show'); });
  clearTimeout(toastT); toastT = window.setTimeout(() => t!.classList.remove('show'), undo ? 5000 : 1800);
}

// ---------- data ----------
const DEF: Settings = { start: '', deloadEvery: 7, scoop: 24, rest: 60, sound: true, rotate: false };
async function load() {
  S = { ...DEF, start: today(), ...((await get<Settings>('kv', 'settings')) || {}) };
  await put('kv', S, 'settings');
  sessions = (await all<Session>('sessions')).sort((a, b) => b.finished - a.finished);
  checkins = Object.fromEntries((await all<Checkin>('checkins')).map(c => [c.date, c]));
  body = (await all<Body>('body')).sort((a, b) => a.date.localeCompare(b.date));
  draft = (await get<Draft>('kv', 'draft')) || null;
  Q = (await get<Quick>('kv', 'quick')) || null;
}
const plan = (d = today()): Day => planFor(d, S.start, S.deloadEvery);
const ex = (id: string): Ex => EX[id] || { id, name: id, kind: 'reps', equip: 'bw', target: '', prim: [], sec: [], diff: 1, w: 0, r: 10, best: false, cues: '' };
const lastSession = (id: string) => sessions.find(s => s.ex?.[id]?.some(x => x.done));
const lastSets = (id: string) => lastSession(id)?.ex![id].filter(x => x.done) || null;
const score = (e: Ex, x: SetLog) => (isLoad(e) ? e1rm(x.w, x.r) : x.r + x.w);
function best(id: string) { let b = 0; for (const s of sessions) for (const x of s.ex?.[id] || []) if (x.done) b = Math.max(b, score(ex(id), x)); return b; }
function setTxt(e: Ex, l: SetLog[]) {
  if (e.kind === 'cardio') return l.map(x => `${x.r} min${x.w ? ` · ${x.w} km` : ''}`).join(', ');
  const u = e.kind === 'time' ? 's' : '';
  const ws = [...new Set(l.map(x => x.w))], rs = [...new Set(l.map(x => x.r))];
  if (ws.length === 1 && rs.length === 1) return `${l.length}×${rs[0]}${u}${ws[0] ? ` @ ${ws[0]} kg` : ''}`;
  return l.map(x => (x.w ? x.w + '×' : '') + x.r + u).join(', ');
}
function lastHint(id: string) { const s = lastSession(id); return s ? `Last: ${setTxt(ex(id), s.ex![id].filter(x => x.done))}, ${ago(s.date)}` : 'First time – start light'; }

function prefill(id: string, sets: number, deload = false): { sets: SetLog[]; hint: string } {
  const e = ex(id), last = lastSets(id);
  let w = e.w, r = e.r, hint = '';
  if (last) {
    const top = last[last.length - 1]; w = top.w; r = top.r;
    if (e.kind === 'reps' || e.kind === 'time') {
      const max = e.kind === 'time' ? 45 : 12;
      if (last.every(x => x.r >= max)) {
        if (e.kind === 'time') { r = top.r + 5; hint = `💪 ${max}s+ on every set – try ${r}s`; }
        else if (!isLoad(e)) hint = '💪 12+ on every set – add reps or slow them down';
        else { const inc = incFor(e); w = top.w + inc; r = 8; hint = `💪 12 reps on every set last time – add weight: +${inc} kg${e.equip === 'db' ? ' (1–2 kg per DB)' : ''}`; }
      }
    }
  } else if (isLoad(e)) hint = 'First time: pick a light weight you can do 12 times easily.';
  if (deload && w && isLoad(e)) { w = Math.round(w * 0.85 * 2) / 2; hint = 'Deload week: lighter (≈85%), stop well short of failure.'; }
  const n = e.kind === 'cardio' ? 1 : last && !sets ? last.length : sets || 3;
  return { sets: Array.from({ length: n }, () => ({ w, r, done: false })), hint };
}
const groupsOf = (d: Draft) => d.groups || WORKOUTS[d.workout];
async function startStrength() {
  const p = plan();
  if (!draft || draft.date !== today()) {
    const rot = S.rotate && Math.floor((p.week - 1) / 4) % 2 === 1;
    const groups = WORKOUTS[p.workout || 'A'].map(g => g.map(id => (rot && ROTATE[id]) || id));
    const exs: Record<string, SetLog[]> = {}, hints: Record<string, string> = {};
    for (const g of groups) for (const id of g) { const f = prefill(id, p.sets, p.deload); exs[id] = f.sets; hints[id] = f.hint; }
    draft = { date: today(), workout: p.workout || 'A', title: p.title + (rot ? ' (variations)' : ''), ex: exs, hints, started: Date.now(), groups };
    await put('kv', draft, 'draft');
  }
  mode = 'runner'; wake(true); render();
}
async function saveSession(s: Session) { await put('sessions', s); sessions.unshift(s); sessions.sort((a, b) => b.finished - a.finished); }

// quick log
async function openQuick(seed?: { title: string; ids: string[]; sets?: number }) {
  if (!Q || seed) { Q = { title: seed?.title || 'Workout', ex: {}, order: [], started: Date.now(), q: '' }; for (const id of seed?.ids || []) addQ(id, seed?.sets); }
  await put('kv', Q, 'quick'); mode = 'quick'; render(); scrollTo(0, 0);
}
function addQ(id: string, sets?: number) { if (!Q || Q.ex[id]) return; Q.ex[id] = prefill(id, sets || 0).sets; Q.order.push(id); }
async function repeatLast() {
  const s = sessions.find(x => x.ex && Object.values(x.ex).some(l => l.some(y => y.done))); if (!s) return toast('Nothing to repeat yet');
  Q = { title: s.title, ex: {}, order: [], started: Date.now(), q: '' };
  for (const id of s.order || Object.keys(s.ex!)) { const l = s.ex![id].filter(x => x.done); if (l.length) { Q.ex[id] = l.map(x => ({ ...x, done: false })); Q.order.push(id); } }
  await put('kv', Q, 'quick'); mode = 'quick'; render(); scrollTo(0, 0);
}
function build30(m: Muscle) {
  if (m === 'cardio') return { title: '30-min cardio blast', ids: ['bikeint', 'thruster', 'burpee', 'farmer'] };
  const list = forMuscle(m).filter(e => e.kind !== 'cardio' && e.prim.includes(m));
  const pick: Ex[] = [];
  for (const e of list) { if (pick.length >= 3) break; if (!pick.some(p => p.equip === e.equip && p.prim[0] === e.prim[0] && pick.length < 2 && p.kind === e.kind && p.id.slice(0, 3) === e.id.slice(0, 3))) pick.push(e); }
  // add a complementary core/carry finisher
  const fin = m === 'core' ? 'farmer' : m === 'quads' || m === 'glutes' || m === 'hamstrings' ? 'plank' : 'deadbug';
  const ids = [...new Set([...pick.map(e => e.id), list[3]?.id, fin].filter(Boolean) as string[])].slice(0, 5);
  return { title: `30-min ${MN[m]}`, ids, sets: 3 };
}

// ---------- timer ----------
interface T { kind: string; title: string; phases: Phase[]; i: number; end: number; left: number; running: boolean; startedAt: number; back: 'tabs' | 'runner'; lastBeep?: number }
let tm: T | null = null; let tick: number | undefined;
function openTimer(kind: 'intervals' | 'steady' | 'easy' | 'warmup', title: string, back: 'tabs' | 'runner' = 'tabs') {
  const phases = phasesFor(kind as any);
  tm = { kind, title, phases, i: 0, end: 0, left: phases[0].secs, running: false, startedAt: 0, back };
  mode = 'timer'; wake(true); render();
}
function timerLoop() {
  clearInterval(tick);
  tick = window.setInterval(() => {
    if ((mode === 'runner' || mode === 'quick') && restEnd) { const l = (restEnd - Date.now()) / 1000; const el = document.getElementById('rest-t'); if (l <= 0) { restEnd = 0; beep(990, 220, 2); render(); } else { if (el) el.textContent = fmt(Math.ceil(l)); const rr = document.getElementById('rest-ring'); if (rr) rr.setAttribute('stroke-dashoffset', String(100 - (l / (restDur / 1000)) * 100)); } }
    if (mode !== 'timer' || !tm || !tm.running) return;
    const l = (tm.end - Date.now()) / 1000;
    if (l <= 3.05 && l > 0 && Math.ceil(l) !== tm.lastBeep) { tm.lastBeep = Math.ceil(l); beep(660, 90); }
    if (l <= 0) {
      if (tm.i < tm.phases.length - 1) { tm.i++; tm.left = tm.phases[tm.i].secs; tm.end = Date.now() + tm.left * 1000; beep(tm.phases[tm.i].hard ? 1200 : 880, 300, 2); render(); }
      else { tm.running = false; tm.left = 0; beep(990, 400, 3); render(); }
      return;
    }
    tm.left = l; const tr = document.getElementById('tring'); if (tr) tr.setAttribute('stroke-dashoffset', String(100 - (l / tm.phases[tm.i].secs) * 100)); const el = document.getElementById('big'); if (el) el.textContent = fmt(Math.ceil(l));
    const tot = document.getElementById('tot'); if (tot) tot.textContent = fmt(totalLeft());
  }, 200);
}
const totalLeft = () => tm ? Math.ceil(tm.left) + tm.phases.slice(tm.i + 1).reduce((a, p) => a + p.secs, 0) : 0;

// ---------- shared pieces ----------
const star = (e: Ex) => (e.best ? `<span class="star" title="Best bang for buck">${I.star}</span>` : '');
const mus = (e: Ex) => e.prim.map(m => MN[m]).join(', ') + (e.sec.length ? ` <small>+ ${e.sec.map(m => MN[m]).join(', ')}</small>` : '');
const mchips = (e: Ex) => `<span class="mch">${e.prim.map(m => `<i style="--mc:${MC[m]}">${MN[m]}</i>`).join('')}${e.sec.slice(0, 2).map(m => `<i class="s2" style="--mc:${MC[m]}">${MN[m]}</i>`).join('')}</span>`;
const eqIc = (e: Ex) => e.kind === 'cardio' ? (e.equip === 'walk' ? I.walk : I.bike) : e.equip === 'bw' ? I.body : e.kind === 'time' ? I.sun : I.dumbbell;
const dots = (n: number) => `<span class="dots">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
let popKey = '';
let restDur = 60000;
function startRest() { restDur = S.rest * 1000; restEnd = Date.now() + restDur; }
function setRow(ctx: 'r' | 'q', id: string, si: number, s: SetLog, gi = 0, pr = 0) {
  const e = ex(id), A = `data-ctx="${ctx}" data-id="${id}" data-i="${si}"`;
  const isPR = s.done && pr > 0 && score(e, s) > pr;
  const step = (f: 'w' | 'r', v: number, unit: string, d: string) => `<div class="stp"><button class="st" data-a="step" data-f="${f}" data-d="-${d}" ${A} aria-label="minus">${I.minus}</button><label><input data-f="${f}" ${A} type="number" inputmode="decimal" step="any" value="${v}"><em>${unit}</em></label><button class="st" data-a="step" data-f="${f}" data-d="${d}" ${A} aria-label="plus">${I.plus}</button></div>`;
  let mid = '';
  if (e.kind === 'cardio') mid = step('r', s.r, 'min', '5') + step('w', s.w, 'km', '0.5');
  else if (e.kind === 'time') mid = (isLoad(e) ? step('w', s.w, 'kg', e.equip === 'bb' ? '2.5' : '1') : '') + step('r', s.r, 'sec', '5');
  else mid = (isLoad(e) ? step('w', s.w, 'kg', e.equip === 'bb' ? '2.5' : '1') : '<span class="bwl">body&shy;weight</span>') + step('r', s.r, 'reps', '1');
  const k = `${ctx}${id}${si}`;
  return `<div class="set ${s.done ? 'done' : ''} ${popKey === k ? 'pop' : ''}"><span class="sn">${isPR ? `<span class="prI">${I.trophy}</span>` : si + 1}</span>${mid}<button class="chk" data-a="done" ${A} data-g="${gi}" aria-label="done">${I.check}</button></div>`;
}
function exBlock(ctx: 'r' | 'q', id: string, list: SetLog[], gi = 0, hint = '') {
  const e = ex(id), pr = best(id), hasPR = list.some(s => s.done && pr > 0 && score(e, s) > pr);
  const nd = list.filter(s => s.done).length;
  return `<div class="exb"><div class="exh"><span class="eqi" style="--mc:${MC[e.prim[0]] || '#888'}">${eqIc(e)}</span><button class="exn" data-a="info" data-id="${id}">${star(e)}${esc(e.name)} <small>${e.target}${e.kind === 'reps' ? ' reps' : ''} · ${nd}/${list.length}</small></button>
   ${ctx === 'r' ? `<button class="sm swap ic2" data-a="swap" data-id="${id}" aria-label="swap">${I.swap}<span>Swap</span></button>` : `<button class="sm swap ic2" data-a="qrm" data-id="${id}" aria-label="remove">${I.x}</button>`}</div>
   <div class="last">${lastHint(id)}${hasPR ? ` <span class="pr">${I.trophy} PR!</span>` : ''}</div>${hint ? `<div class="hint">${hint}</div>` : ''}
   <div class="sets">${list.map((s, si) => setRow(ctx, id, si, s, gi, pr)).join('')}</div>
   ${e.kind === 'cardio' ? '' : `<div class="setbtns"><button class="sm ghost" data-a="setadd" data-ctx="${ctx}" data-id="${id}">${I.plus} Set</button>${list.length > 1 ? `<button class="sm ghost" data-a="setrm" data-ctx="${ctx}" data-id="${id}">${I.minus} Set</button>` : ''}</div>`}</div>`;
}
const restBar = () => { if (!restEnd) return ''; const l = Math.max(0, (restEnd - Date.now()) / 1000);
  return `<div class="rest">${ring(l / (restDur / 1000), 62, 7, 'rest-r', I.moon, 'rest-ring')}<div class="rlab"><small>Rest</small><b id="rest-t">${fmt(Math.ceil(l))}</b></div><button data-a="rest+">+15</button><button data-a="restskip">Skip</button></div>`; };
// ---------- views ----------
function weekStrip() {
  const d0 = parse(today()); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
  let h = '<div class="wk">';
  for (let i = 0; i < 7; i++) { const d = new Date(d0); d.setDate(d0.getDate() + i); const di = iso(d), p = plan(di); const done = sessions.some(s => s.date === di);
    const ic = { strength: I.dumbbell, steady: I.bike, intervals: I.bolt, easy: I.walk, rest: I.moon }[p.type];
    h += `<span class="${done ? 'done' : ''} ${di === today() ? 'now' : ''} t-${p.type}"><b>${'MTWTFSS'[i]}</b><i>${done ? I.check : ic}</i><small>${d.getDate()}</small></span>`; }
  return h + '</div>';
}
function weekCount() { const d0 = parse(today()); d0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7)); const s = new Set<string>();
  for (const x of sessions) { const t = parse(x.date).getTime(); if (t >= d0.getTime() && t < d0.getTime() + 7 * 864e5) s.add(x.date); } return s.size; }
function bodyPrompts() {
  const lastW = [...body].reverse().find(b => b.weight), lastWa = [...body].reverse().find(b => b.waist);
  const needW = !lastW || daysAgo(lastW.date) >= 7, needWa = !lastWa || daysAgo(lastWa.date) >= 14;
  if (!needW && !needWa) return '';
  return `<div class="card prompt"><div class="ph2"><span class="pic">${I.scale}</span><div><h3>${needW ? 'Weekly weigh-in' : ''}${needW && needWa ? ' · ' : ''}${needWa ? 'Waist check' : ''}</h3>
  <small>${needW ? `Last weight: ${lastW ? lastW.weight + ' kg, ' + nice(lastW.date) : 'none yet'}. ` : ''}${needWa ? `Waist every 2–4 weeks${lastWa ? ` (last ${lastWa.waist} cm)` : ''}.` : ''}</small></div></div>
  <div class="row">${needW ? `<input id="bw" type="number" inputmode="decimal" step="0.1" placeholder="Weight kg">` : ''}${needWa ? `<input id="bwa" type="number" inputmode="decimal" step="0.5" placeholder="Waist cm">` : ''}<button class="go sm" data-a="savebody">Save</button></div></div>`;
}
function checkinCard() {
  const c = checkins[today()] || { date: today() }; const g = c.grams || 0, sl = c.sleep || 0, st = c.steps || 0;
  const fp = c.protein ? Math.max(1, g / 140) : g / 140;
  return `<section class="card ck2"><div class="ckh"><h3>Daily rings</h3><small class="mut">close all three</small></div>
  <div class="ckrow">${rings3([[fp, 'p'], [sl / 7, 's'], [st / 7500, 't']])}<div class="ckleg">
   <div class="lg p"><i></i><span>Protein</span><b>${g}<small> / 140 g</small></b></div>
   <div class="lg s"><i></i><span>Sleep</span><b>${sl}<small> / 7 h</small></b></div>
   <div class="lg t"><i></i><span>Steps</span><b>${st.toLocaleString()}<small> / 7.5k</small></b></div></div></div>
  <div class="cki"><label class="p">Protein<input id="ck-g" type="number" inputmode="numeric" placeholder="grams" value="${g || ''}"></label><button class="sm scoop" data-a="scoop">${I.plus} Scoop ${S.scoop} g</button><button class="tg p ${c.protein || g >= 130 ? 'on' : ''}" data-a="ck-protein" aria-label="Protein goal hit">${I.check}</button></div>
  <div class="cki"><label class="s">Sleep<input id="ck-s" type="number" inputmode="decimal" step="0.5" placeholder="hours" value="${c.sleep ?? ''}"></label><button class="tg s ${sl >= 7 ? 'on' : ''}" data-a="ck-sleep" aria-label="Slept 7 h+">${I.check}</button></div>
  <div class="cki"><label class="t">Steps<input id="ck-st" type="number" inputmode="numeric" placeholder="steps today" value="${c.steps ?? ''}"></label><span class="tg t ${st >= 7000 ? 'on' : ''}">${I.check}</span></div>
  <small class="mut">USN Hardcore Whey scoop quick-add · grams per scoop in Settings</small></section>`;
}
function vToday() {
  const p = plan(), done = sessions.find(s => s.date === today());
  const { streak } = weeks(), wn = weekCount();
  const note = p.deload ? `<span class="badge dl">Deload week – lighter</span>` : p.early ? `<span class="badge">Easy start – 2 sets, light</span>` : '';
  let b2 = '';
  if (p.type === 'strength') b2 = `<div class="sslist">${WORKOUTS[p.workout!].map((g, i) => `<div class="ss"><span class="ssn">${g.length > 1 ? i + 1 : 'C'}</span><div><b>${g.map(id => esc(ex(id).name)).join(' + ')}</b><small>${g.length > 1 ? 'Superset' : 'Core'} · ${p.sets} × ${ex(g[0]).target}</small></div></div>`).join('')}</div><small class="hm">8–12 reps · 45–60 s rest between supersets</small>`;
  const btn = p.type === 'rest' ? '' : `<button class="start" data-a="start">${I.play}<span>${done ? 'Do it again' : draft && draft.date === today() ? 'Continue' : 'Start planned'}</span></button>`;
  const last = sessions.find(x => x.ex);
  const h = new Date().getHours(), greet = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  const tl = { strength: 'Strength', steady: 'Steady ride', intervals: 'Intervals', easy: 'Active recovery', rest: 'Rest day' }[p.type];
  const hi = { strength: I.dumbbell, steady: I.bike, intervals: I.bolt, easy: I.walk, rest: I.moon }[p.type];
  return `<header class="hd top"><div><small class="eyebrow">${nice(today())} · Week ${p.week}</small><h1 class="title">${greet}, Thinus</h1></div>
   <div class="streak ${streak ? 'on' : ''}">${I.flame}<b>${streak}</b><small>wk</small></div></header>
  <section class="hero t-${p.type}"><div class="hero-top"><div class="hl"><span class="pill">${hi}${tl}</span><h2>${p.title}</h2><p>${p.sub}</p>${note}</div>
   ${ring(wn / 5, 92, 10, 'goal', `<b>${wn}</b><small>of 5</small>`)}</div>
   ${b2}${done ? `<p class="ok">${I.check} Done today${done.mins ? ` – ${done.mins} min` : ''}</p>` : ''}${btn}
   ${p.type === 'easy' && !done ? '<button class="sm wide glass" data-a="quickdone">Mark walk done</button>' : ''}</section>
  ${weekStrip()}
  <div class="qa"><button class="big2 a1" data-a="quick"><span class="qi">${I.edit}</span><b>What did you do?</b><small>${Q ? 'Continue your log' : 'Tick exercises, weights fill in'}</small></button>
  <button class="big2" data-a="repeat" ${last ? '' : 'disabled'}><span class="qi">${I.repeat}</span><b>Repeat last</b><small>${last ? esc(last.title) + ' · ' + ago(last.date) : 'no sessions yet'}</small></button></div>
  ${bodyPrompts()}${checkinCard()}`;
}
function vRunner() {
  const d = draft!, p = plan(d.date);
  const all = Object.values(d.ex).flat(), nd = all.filter(x => x.done).length;
  let h = `<header class="hd run"><button class="sm ic" data-a="back" aria-label="Back">${I.back}</button><div class="rt2"><h2>${esc(d.title)}</h2><small>${nd}/${all.length} sets</small></div><button class="go sm" data-a="finish">Finish</button></header>
  <div class="pbar"><i style="width:${all.length ? (nd / all.length) * 100 : 0}%"></i></div>
  <div class="card warm"><span class="eqi" style="--mc:#ff7a3d">${I.bike}</span><div><b>Warm-up</b><small>3 min easy on the bike</small></div><button class="sm" data-a="warmup">${I.play} 3:00</button></div>`;
  groupsOf(d).forEach((g, gi) => {
    h += `<div class="card grp"><h3><span class="ssn">${g.length > 1 ? gi + 1 : 'C'}</span>${g.length > 1 ? `Superset ${gi + 1}` : 'Core'} <small>${g.length > 1 ? 'alternate, then rest' : ''}</small></h3>`;
    for (const id of g) h += exBlock('r', id, d.ex[id], gi, d.hints[id]);
    h += `</div>`;
  });
  if (p.sets < 3) h += `<small class="mut">${p.deload ? 'Deload week' : 'Weeks 1–2'}: ${p.sets} sets.</small>`;
  h += restBar();
  if (swapFor) { const alts = altsFor(swapFor).slice(0, 8);
    h += `<div class="sheet"><div class="sh"><span class="grab"></span><h3>Swap ${esc(ex(swapFor).name)} for…</h3><small class="mut">Same muscles – keeps it fresh</small>
    ${alts.map(a => `<button class="li" data-a="swapto" data-id="${a.id}"><span class="eqi" style="--mc:${MC[a.prim[0]]}">${eqIc(a)}</span><span class="lt2">${star(a)}<b>${esc(a.name)}</b><small>${mus(a)}</small></span>${dots(a.diff)}</button>`).join('')}
    <button class="sm wide" data-a="swapx">Cancel</button></div></div>`; }
  return h;
}
function pickRow(e: Ex) {
  const on = !!Q?.ex[e.id];
  return `<button class="li pick ${on ? 'on' : ''}" data-a="qtoggle" data-id="${e.id}"><span class="tk">${I.check}</span><span class="lt2">${star(e)}<b>${esc(e.name)}</b><small>${lastSession(e.id) ? lastHint(e.id) : e.prim.map(m => MN[m]).join(', ')}</small></span><span class="mdot" style="--mc:${MC[e.prim[0]]}"></span></button>`;
}
function pickList() {
  const q = Q!.q.trim().toLowerCase();
  if (q) { const m = LIB.filter(e => (e.name + ' ' + e.prim.join(' ') + ' ' + e.sec.join(' ')).toLowerCase().includes(q)); return m.length ? m.map(pickRow).join('') : '<p class="empty">No match</p>'; }
  const p = plan(); const seen = new Set<string>(); let h = '';
  const sec = (t: string, ids: string[]) => { const l = ids.filter(id => EX[id] && !seen.has(id)); l.forEach(id => seen.add(id)); if (l.length) h += `<h3 class="gh">${t}</h3>` + l.map(id => pickRow(EX[id])).join(''); };
  if (p.type === 'strength') sec('📋 Planned today', WORKOUTS[p.workout!].flat());
  else if (p.type !== 'rest') sec('📋 Planned today', [p.type === 'intervals' ? 'bikeint' : p.type === 'easy' ? 'walk' : 'bikesteady']);
  const rec: string[] = []; for (const s of sessions) for (const id of s.order || Object.keys(s.ex || {})) if (!rec.includes(id)) rec.push(id);
  sec('🕘 Recent', rec.slice(0, 10));
  for (const [m, n] of MUSCLES) sec(n, LIB.filter(e => e.prim[0] === m).map(e => e.id));
  return h;
}
function vQuick() {
  const q = Q!;
  return `<header class="hd run"><button class="sm ic" data-a="qback" aria-label="Back">${I.back}</button><input class="ttl" id="q-title" value="${esc(q.title)}"><button class="go sm" data-a="qsave" ${q.order.length ? '' : 'disabled'}>Save</button></header>
  ${q.order.length ? q.order.map(id => `<div class="card grp">${exBlock('q', id, q.ex[id])}</div>`).join('') : empty(I.edit, 'What did you do today?', 'Tick exercises below – weights &amp; reps fill in from last time. Adjust with − / +.')}
  <div class="card"><h3>What did you do?</h3><label class="srch">${I.search}<input id="q-search" type="search" placeholder="Search exercises or muscles" value="${esc(q.q)}"></label><div id="pick">${pickList()}</div></div>${restBar()}`;
}
function vTimer() {
  const t = tm!, ph = t.phases[t.i], fin = !t.running && t.left === 0;
  const next = t.phases[t.i + 1];
  return `<div class="timer ${ph.hard ? 'hard' : 'cool'} ${fin ? 'fin' : ''} ${t.running ? 'run' : ''}"><div class="glow"></div><header class="hd run"><button class="sm ic" data-a="tback" aria-label="Back">${I.back}</button><h2>${t.title}</h2><span class="phn">${t.i + 1}/${t.phases.length}</span></header>
  ${ring(fin ? 1 : t.left / ph.secs, 320, 20, 'big-r', `<div class="ph">${fin ? 'Done! 🎉' : ph.name}</div><div id="big" class="big">${fmt(Math.ceil(t.left))}</div><div class="nx">${next && !fin ? `Next · ${next.name} ${fmt(next.secs)}` : ''}</div>`, 'tring')}
  <div class="prog">${t.phases.length > 1 ? t.phases.map((p, i) => `<i class="${p.hard ? 'h' : ''} ${i < t.i ? 'p' : i === t.i ? 'c' : ''}" style="flex:${p.secs}"></i>`).join('') : ''}</div>
  <small class="tot">Total left <b id="tot">${fmt(totalLeft())}</b></small>
  <div class="tb">${fin ? '' : `<div class="tb2"><button class="start" data-a="tgo">${t.running ? I.pause + '<span>Pause</span>' : I.play + `<span>${t.startedAt ? 'Resume' : 'Start'}</span>`}</button><button class="sm skip" data-a="tskip">Skip ›</button></div>`}
  ${t.kind === 'warmup' ? '' : `<button class="go" data-a="tsave">Finish &amp; save</button>`}</div></div>`;
}
function vLog() {
  if (!sessions.length) return '<h1 class="title">Log</h1>' + empty(I.log, 'No workouts yet', 'Your sessions show up here once you log one.');
  const ti = (t: string) => ({ strength: I.dumbbell, steady: I.bike, intervals: I.bolt, easy: I.walk, quick: I.edit } as any)[t] || I.dumbbell;
  return '<h1 class="title">Log</h1>' + sessions.slice(0, 150).map(s => `<div class="card lg2"><div class="ehead"><span class="eqi t-${s.type}">${ti(s.type)}</span><div><b>${esc(s.title)}</b><small>${nice(s.date)}${s.mins ? ` · ${s.mins} min` : ''}</small></div><button class="del" data-a="delsess" data-id="${s.id}" aria-label="Delete">${I.x}</button></div>
  ${s.ex ? (s.order || Object.keys(s.ex)).filter(id => s.ex![id]?.some(x => x.done)).map(id => `<div class="lr"><button class="lnk" data-a="info" data-id="${id}">${esc(ex(id).name)}</button><small>${setTxt(ex(id), s.ex![id].filter(x => x.done))}</small></div>`).join('') : ''}
  ${s.ex ? `<button class="sm again ghost" data-a="again" data-id="${s.id}">${I.repeat} Do again</button>` : ''}</div>`).join('');
}
// simple front/back body map; each region carries data-m
function bodyMap() {
  const on = (m: string) => libM === m ? 'on' : libM && ex2m(m) ? 'sec' : '';
  const R = (m: string, sh: string) => `<g class="bm ${on(m)}" data-a="muscle" data-id="${m}">${sh}</g>`;
  const el = (cx: number, cy: number, rx: number, ry: number, rot = 0) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"${rot ? ` transform="rotate(${rot} ${cx} ${cy})"` : ''}/>`;
  const pair = (cx: number, cy: number, rx: number, ry: number, rot = 0) => el(cx, cy, rx, ry, rot) + el(120 - cx, cy, rx, ry, -rot);
  const sil = `<path class="sil" d="M60 6c8 0 13 6 13 14s-5 15-13 15-13-7-13-15 5-14 13-14zM52 34h16l2 6c9 1 17 3 22 8 4 4 5 10 6 17l4 40c1 6-1 9-5 9s-6-3-6-8l-4-34-3 30c4 10 6 21 5 33l-3 48c-1 7-2 12-4 15h-12l-1-14 1-48-4-30-4 30 1 48-1 14H48c-2-3-3-8-4-15l-3-48c-1-12 1-23 5-33l-3-30-4 34c0 5-2 8-6 8s-6-3-5-9l4-40c1-7 2-13 6-17 5-5 13-7 22-8z"/>`;
  const front = sil + R('shoulders', pair(35, 51, 10, 9, -20)) + R('chest', pair(49, 58, 12, 9)) + R('biceps', pair(28, 75, 6, 13, 10)) + R('core', `<rect x="49" y="70" width="22" height="40" rx="9"/>` + pair(44, 92, 4, 14)) + R('quads', pair(49, 148, 10, 27, 4)) + R('calves', pair(50, 196, 6, 15));
  const back = sil + R('shoulders', pair(35, 51, 10, 9, -20)) + R('back', `<path d="M48 40h24l8 10-6 44H46l-6-44z"/>`) + R('triceps', pair(28, 75, 6, 13, 10)) + R('core', `<rect x="51" y="96" width="18" height="12" rx="5"/>`) + R('glutes', pair(50, 122, 11, 11)) + R('hamstrings', pair(49, 156, 9, 22, 3)) + R('calves', pair(50, 194, 7, 16));
  return `<svg class="bodymap" viewBox="0 0 270 236"><g>${front}<text x="60" y="232" text-anchor="middle" class="ax">FRONT</text></g><g transform="translate(150,0)">${back}<text x="60" y="232" text-anchor="middle" class="ax">BACK</text></g></svg>`;
}
const ex2m = (m: string) => !!libM && forMuscle(libM).slice(0, 6).some(e => e.sec.includes(m as Muscle));
function libRow(e: Ex) {
  return `<div class="li lib"><button class="lt" data-a="info" data-id="${e.id}"><span class="eqi" style="--mc:${MC[e.prim[0]]}">${eqIc(e)}</span><span class="lt2"><b>${esc(e.name)}${e.best ? ` <span class="bb">${I.star}Best</span>` : ''}</b>${mchips(e)}</span>${dots(e.diff)}</button>
  <button class="sm add ${Q?.ex[e.id] ? 'on' : ''}" data-a="addtoday" data-id="${e.id}" aria-label="Add to today">${Q?.ex[e.id] ? I.check : I.plus}</button></div>`;
}
function vLib() {
  const q = libQ.trim().toLowerCase();
  let list = libM ? forMuscle(libM) : LIB.slice().sort((a, b) => +b.best - +a.best);
  if (q) list = list.filter(e => (e.name + ' ' + e.prim.join(' ')).toLowerCase().includes(q));
  return `<h1 class="title">Exercises <small class="mut">${LIB.length}</small></h1><div class="card bmc">${bodyMap()}
  <div class="chips">${MUSCLES.map(([m, n]) => `<button class="chip ${libM === m ? 'sel' : ''}" data-a="muscle" data-id="${m}" style="--mc:${MC[m]}"><i></i>${n}</button>`).join('')}</div>
  ${libM ? `<button class="start s2" data-a="build" data-id="${libM}">${I.bolt}<span>Build me a 30-min ${MN[libM]} workout</span></button>` : `<small class="mut">Tap a muscle to see what trains it. <span class="bb">${I.star}Best</span> = best bang for buck.</small>`}</div>
  <label class="srch">${I.search}<input id="lib-search" type="search" placeholder="Search ${LIB.length} exercises" value="${esc(libQ)}"></label>
  ${libM ? `<h3 class="gh">${MN[libM]} · ${list.length} moves, best first</h3>` : ''}
  <div id="liblist">${list.map(libRow).join('') || empty(I.search, 'No match', 'Try another word or muscle.')}</div>`;
}
function vDetail() {
  const e = ex(detailId), rows = sessions.filter(s => s.ex?.[e.id]?.some(x => x.done)).map(s => ({ s, l: s.ex![e.id].filter(x => x.done) }));
  const pts = rows.map(({ s, l }) => [parse(s.date).getTime(), isLoad(e) ? Math.max(...l.map(x => x.w)) : Math.max(...l.map(x => x.r))] as [number, number]);
  const pts2 = isLoad(e) ? rows.map(({ s, l }) => [parse(s.date).getTime(), Math.round(Math.max(...l.map(x => e1rm(x.w, x.r))) * 10) / 10] as [number, number]) : [];
  const pr = best(e.id), alts = altsFor(e.id).slice(0, 4);
  const u = isLoad(e) ? 'kg' : e.kind === 'time' ? 's' : e.kind === 'cardio' ? 'min' : 'reps';
  return `<header class="hd run"><button class="sm ic" data-a="dback" aria-label="Back">${I.back}</button><span></span><button class="go sm" data-a="addtoday" data-id="${e.id}">${I.plus} Add to today</button></header>
  <section class="dhero" style="--mc:${MC[e.prim[0]]}"><span class="eqi big">${eqIc(e)}</span><h1>${esc(e.name)}</h1>${mchips(e)}
  <div class="stats"><div><b>${['', 'Beginner', 'Inter&shy;mediate', 'Advanced'][e.diff]}</b><small>level</small></div><div><b>${e.target}</b><small>${e.kind === 'reps' ? 'reps' : e.kind === 'time' ? 'seconds' : 'minutes'}</small></div><div><b>${rows.length}</b><small>sessions</small></div></div>
  ${e.best ? `<span class="bb lg">${I.star}Best bang for buck</span>` : ''}</section>
  <div class="card"><h3>How to</h3><ol class="cues">${e.cues.split('|').map(c => `<li>${esc(c)}</li>`).join('')}</ol>
  <small class="mut">Starting point: ${isLoad(e) ? e.w + ' kg × ' : ''}${e.r}${e.kind === 'time' ? ' s' : e.kind === 'cardio' ? ' min' : ' reps'}</small></div>
  <div class="card"><h3>History ${pr ? `<span class="pr">${I.trophy} Best ${isLoad(e) ? 'est. 1RM ' + Math.round(pr * 10) / 10 + ' kg' : Math.round(pr)}</span>` : ''}</h3>
  ${rows.length ? chart(isLoad(e) ? [{ pts, c: 'var(--c1)', l: 'Top weight' }, { pts: pts2, c: 'var(--c2)', l: 'Est. 1RM' }] : [{ pts, c: 'var(--c1)', l: e.kind === 'time' ? 'Best hold (s)' : e.kind === 'cardio' ? 'Minutes' : 'Best reps' }], u) : empty(I.chart, 'Not logged yet', 'Log it once and your trend appears here.')}
  ${rows.slice(0, 8).map(({ s, l }) => `<div class="lr"><span>${nice(s.date)}</span><small>${setTxt(e, l)}</small></div>`).join('')}</div>
  ${alts.length ? `<div class="card"><h3>Alternatives</h3>${alts.map(a => `<button class="li" data-a="info" data-id="${a.id}"><span class="eqi" style="--mc:${MC[a.prim[0]]}">${eqIc(a)}</span><span class="lt2">${star(a)}<b>${esc(a.name)}</b><small>${mus(a)}</small></span>${dots(a.diff)}</button>`).join('')}</div>` : ''}`;
}
let chartN = 0;
function chart(series: { pts: [number, number][]; c: string; l: string }[], unit = '') {
  const pts = series.flatMap(s => s.pts); if (pts.length < 1) return empty(I.chart, 'Not enough data yet', 'Add a couple of entries to see the trend.');
  const W = 360, H = 180, P = 30, id = 'cg' + chartN++; let x0 = Math.min(...pts.map(p => p[0])), x1 = Math.max(...pts.map(p => p[0])); if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
  let y0 = Math.min(...pts.map(p => p[1])), y1 = Math.max(...pts.map(p => p[1])); const pad = (y1 - y0) * 0.18 || 2; y0 -= pad; y1 += pad;
  const X = (x: number) => P + ((x - x0) / (x1 - x0)) * (W - P - 10), Y = (y: number) => H - 22 - ((y - y0) / (y1 - y0)) * (H - 34);
  const smooth = (q: [number, number][]) => q.map((p, i) => { if (!i) return `M${p[0]},${p[1]}`; const a = q[i - 2] || q[i - 1], b = q[i - 1], c = p, d = q[i + 1] || p;
    return `C${b[0] + (c[0] - a[0]) / 6},${b[1] + (c[1] - a[1]) / 6} ${c[0] - (d[0] - b[0]) / 6},${c[1] - (d[1] - b[1]) / 6} ${c[0]},${c[1]}`; }).join('');
  let g = `<defs>${series.map((s, k) => `<linearGradient id="${id}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${s.c};stop-opacity:.45"/><stop offset="1" style="stop-color:${s.c};stop-opacity:0"/></linearGradient>`).join('')}</defs>`;
  for (let i = 0; i <= 3; i++) { const v = y0 + ((y1 - y0) * i) / 3; g += `<line class="grid" x1="${P}" x2="${W}" y1="${Y(v)}" y2="${Y(v)}"/><text class="ax" x="2" y="${Y(v) + 4}">${Math.round(v)}</text>`; }
  g += `<text class="ax" x="${P}" y="${H - 4}">${nice(iso(new Date(x0)))}</text><text class="ax" text-anchor="end" x="${W}" y="${H - 4}">${nice(iso(new Date(x1)))}</text>`;
  let dots2 = '';
  series.forEach((s, k) => { const pp = s.pts.sort((a, b) => a[0] - b[0]).map(p => [X(p[0]), Y(p[1]), p[0], p[1]] as const); if (!pp.length) return;
    const xy = pp.map(p => [p[0], p[1]] as [number, number]), d = smooth(xy);
    if (k === 0) g += `<path d="${d}L${xy[xy.length - 1][0]},${H - 22}L${xy[0][0]},${H - 22}Z" style="fill:url(#${id}${k})"/>`;
    g += `<path class="ln" d="${d}" fill="none" style="stroke:${s.c}" stroke-width="3" stroke-linecap="round"/>`;
    const lst = pp[pp.length - 1]; g += `<circle cx="${lst[0]}" cy="${lst[1]}" r="5" style="fill:${s.c}" class="lastpt"/>`;
    dots2 += pp.map(p => `<circle class="hit" cx="${p[0]}" cy="${p[1]}" r="13" data-a="tip" data-tip="${esc(s.l)}: ${p[3]} ${unit} · ${nice(iso(new Date(p[2])))}" data-x="${(p[0] / W) * 100}" data-y="${(p[1] / H) * 100}" data-c="${s.c}"/>`).join(''); });
  return `<div class="chartw"><svg class="chart" viewBox="0 0 ${W} ${H}">${g}${dots2}</svg><div class="tip"></div></div><div class="legend">${series.map(s => `<span><i style="background:${s.c}"></i>${s.l}</span>`).join('')}<small>tap a point · ${unit}</small></div>`;
}
function weeks() {
  const out: { label: string; done: number; ok: boolean }[] = []; const w0 = parse(S.start); w0.setDate(w0.getDate() - ((w0.getDay() + 6) % 7));
  const now = parse(today()); const dates = new Set(sessions.map(s => s.date));
  for (let d = new Date(w0); d <= now; d.setDate(d.getDate() + 7)) { let n = 0; for (let i = 0; i < 6; i++) { const x = new Date(d); x.setDate(d.getDate() + i); if (dates.has(iso(x))) n++; } out.push({ label: `${d.getDate()}/${d.getMonth() + 1}`, done: n, ok: n >= 5 }); }
  let streak = 0; for (let i = out.length - 1; i >= 0; i--) { if (out[i].ok) streak++; else if (i === out.length - 1) continue; else break; }
  return { out, streak };
}
function vProgress() {
  const ids = LIB.filter(e => isLoad(e) && e.kind === 'reps' && lastSession(e.id)).map(e => e.id);
  if (ids.length && !ids.includes(progEx)) progEx = ids[0];
  const rows = sessions.filter(s => s.ex?.[progEx]?.some(x => x.done)).map(s => { const d = s.ex![progEx].filter(x => x.done); return { t: parse(s.date).getTime(), w: Math.max(...d.map(x => x.w)), e: Math.max(...d.map(x => e1rm(x.w, x.r))) }; });
  const { out, streak } = weeks();
  const tot = sessions.length, mins = sessions.reduce((a, s) => a + (s.mins || 0), 0);
  return `<h1 class="title">Progress</h1>
  <div class="kpis"><div class="kpi fl2">${I.flame}<b>${streak}</b><small>week streak</small></div><div class="kpi">${I.dumbbell}<b>${tot}</b><small>sessions</small></div><div class="kpi">${I.bolt}<b>${Math.round(mins / 60)}<small>h</small></b><small>trained</small></div></div>
  <div class="card"><h3>Weekly consistency <small>5+ of 6 sessions Mon–Sat</small></h3>
  <div class="bars">${out.slice(-10).map(w => `<div><span class="bn">${w.done || ''}</span><i class="${w.ok ? 'ok' : ''}" style="height:${Math.max(4, (w.done / 6) * 100)}%"></i><small>${w.label}</small></div>`).join('')}</div></div>
  <div class="card"><h3>Strength</h3><div class="chips sc">${ids.map(id => `<button class="chip ${id === progEx ? 'sel' : ''}" data-a="pex" data-id="${id}" style="--mc:${MC[ex(id).prim[0]]}">${ex(id).name.replace(/ \(.*\)/, '')}</button>`).join('')}</div>
  ${chart([{ pts: rows.map(r => [r.t, r.w]), c: 'var(--c1)', l: 'Top weight' }, { pts: rows.map(r => [r.t, Math.round(r.e * 10) / 10]), c: 'var(--c2)', l: 'Est. 1RM' }], 'kg')}
  ${ids.length ? `<button class="sm wide ghost" data-a="info" data-id="${progEx}">${I.info} ${esc(ex(progEx).name)} details</button>` : ''}</div>
  <div class="card"><h3>Body weight</h3>${chart([{ pts: body.filter(b => b.weight).map(b => [parse(b.date).getTime(), b.weight!]), c: 'var(--c3)', l: 'Weight' }], 'kg')}</div>
  <div class="card"><h3>Waist</h3>${chart([{ pts: body.filter(b => b.waist).map(b => [parse(b.date).getTime(), b.waist!]), c: 'var(--c4)', l: 'Waist' }], 'cm')}</div>
  <div class="card"><h3>Add a measurement</h3><div class="row"><input id="bw" type="number" inputmode="decimal" step="0.1" placeholder="Weight kg"><input id="bwa" type="number" inputmode="decimal" step="0.5" placeholder="Waist cm"><button class="go sm" data-a="savebody">Save</button></div></div>`;
}
function vSettings() {
  const th = S.theme || 'dark';
  return `<h1 class="title">Settings</h1><div class="card"><h3>Appearance</h3><div class="seg">${[['dark', 'Dark', I.moon], ['light', 'Light', I.sun], ['auto', 'Auto', I.gear]].map(([k, l, ic]) => `<button class="${th === k ? 'sel' : ''}" data-a="theme" data-id="${k}">${ic}${l}</button>`).join('')}</div></div>
  <div class="card"><h3>Program</h3>
  <label class="fl">Program start date<input id="s-start" type="date" value="${S.start}"></label>
  <label class="fl">Deload week every (weeks, 0 = off)<input id="s-dl" type="number" inputmode="numeric" value="${S.deloadEvery}"></label>
  <label class="fl">Protein per USN Hardcore Whey scoop (g)<input id="s-sc" type="number" inputmode="numeric" value="${S.scoop}"></label>
  <label class="fl">Rest timer (seconds)<input id="s-rest" type="number" inputmode="numeric" value="${S.rest}"></label>
  <button class="tick ${S.sound ? 'on' : ''}" data-a="sound">${I.bell}<span>Beeps &amp; vibration</span><i class="sw"></i></button>
  <button class="tick ${S.rotate ? 'on' : ''}" data-a="rotate">${I.repeat}<span>Rotate variations every 4 weeks</span><i class="sw"></i></button>
  <small class="mut">When on, weeks 5–8, 13–16… swap the planned moves for a variation (e.g. goblet squat → Bulgarian split squat).</small>
  <button class="go wide" data-a="saveset">Save settings</button></div>
  <div class="card"><h3>Backup</h3><p class="mut">Data lives only on this phone. Export a backup now and then.</p>
  <button class="sm wide ghost" data-a="export">${I.down} Export backup (JSON)</button><label class="sm wide imp ghost">${I.up} Import backup<input id="imp" type="file" accept="application/json,.json" hidden></label></div>
  <p class="mut ctr">Fit v${VERSION} · Week ${plan().week} of your program · ${LIB.length} exercises</p>`;
}
let lastView = '';
function applyTheme() { const t = S.theme || 'dark'; document.documentElement.dataset.theme = t;
  const dark = t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.querySelector('meta[name=theme-color]')?.setAttribute('content', dark ? '#0b0c10' : '#f4f5f7'); }
function render() {
  let html = '';
  if (mode === 'runner' && draft) html = `<main>${vRunner()}</main>`;
  else if (mode === 'quick' && Q) html = `<main>${vQuick()}</main>`;
  else if (mode === 'detail') html = `<main>${vDetail()}</main>`;
  else if (mode === 'timer' && tm) html = vTimer();
  else { mode = 'tabs';
    const v = { today: vToday, log: vLog, lib: vLib, progress: vProgress, settings: vSettings }[tab]();
    html = `<main>${v}</main><nav class="tabs">${([['today', 'Today', I.home], ['lib', 'Exercises', I.dumbbell], ['log', 'Log', I.log], ['progress', 'Progress', I.chart], ['settings', 'Settings', I.gear]] as const).map(([k, l, ic]) => `<button class="${tab === k ? 'sel' : ''}" data-tab="${k}" aria-label="${l}">${ic}<span>${l}</span></button>`).join('')}</nav>`;
  }
  const key = mode + (mode === 'tabs' ? tab : mode === 'detail' ? detailId : '');
  app.innerHTML = DEFS + html; popKey = '';
  if (key !== lastView) { app.querySelector('main,.timer')?.classList.add('enter'); lastView = key; }
}
// ---------- events ----------
async function saveCheckin(patch: Partial<Checkin>) { const c = { ...(checkins[today()] || { date: today() }), ...patch }; checkins[today()] = c; await put('checkins', c); }
const listOf = (ctx: string, id: string) => (ctx === 'q' ? Q!.ex[id] : draft!.ex[id]);
const persist = (ctx: string) => (ctx === 'q' ? put('kv', Q, 'quick') : put('kv', draft, 'draft'));
function keepScroll(fn: () => void) { const y = scrollY; fn(); scrollTo(0, y); }
app.addEventListener('input', ev => {
  const t = ev.target as HTMLInputElement;
  if (t.id === 'q-search' && Q) { Q.q = t.value; document.getElementById('pick')!.innerHTML = pickList(); }
  if (t.id === 'lib-search') { libQ = t.value; const y = scrollY; const pos = t.selectionStart; render(); const n = $('#lib-search') as HTMLInputElement; n.focus(); n.setSelectionRange(pos, pos); scrollTo(0, y); }
  if (t.id === 'q-title' && Q) { Q.title = t.value; put('kv', Q, 'quick'); }
});
app.addEventListener('change', async ev => {
  const t = ev.target as HTMLInputElement;
  if (t.dataset.f && t.dataset.ctx) { const l = listOf(t.dataset.ctx, t.dataset.id!), i = +t.dataset.i!; (l[i] as any)[t.dataset.f] = +t.value || 0;
    l.forEach((x, j) => { if (j > i && !x.done) (x as any)[t.dataset.f!] = (l[i] as any)[t.dataset.f!]; });
    await persist(t.dataset.ctx); keepScroll(render); return; }
  if (t.id === 'ck-g') { await saveCheckin({ grams: +t.value || 0 }); render(); }
  if (t.id === 'ck-s') { await saveCheckin({ sleep: +t.value || 0 }); render(); }
  if (t.id === 'ck-st') { await saveCheckin({ steps: +t.value || 0 }); render(); }
  if (t.id === 'imp' && t.files?.[0]) { try { await importAll(JSON.parse(await t.files[0].text())); await load(); toast('Backup imported'); render(); } catch (e: any) { alert(e.message); } }
});
app.addEventListener('click', async ev => {
  const b = (ev.target as HTMLElement).closest('[data-a],[data-tab]') as HTMLElement | null; if (!b) return;
  if (b.dataset.tab) { tab = b.dataset.tab as Tab; render(); scrollTo(0, 0); return; }
  const a = b.dataset.a!, id = b.dataset.id!, i = +(b.dataset.i || 0), ctx = b.dataset.ctx || 'r';
  const p = plan();
  switch (a) {
    case 'start': if (p.type === 'strength') await startStrength(); else openTimer(p.type as any, p.title); timerLoop(); break;
    case 'quickdone': await saveSession({ id: crypto.randomUUID(), date: today(), type: 'easy', title: 'Walk', ex: { walk: [{ w: 0, r: 30, done: true }] }, order: ['walk'], mins: 30, finished: Date.now() }); toast('Nice – logged'); render(); break;
    case 'quick': await openQuick(); break;
    case 'repeat': await repeatLast(); break;
    case 'back': mode = 'tabs'; restEnd = 0; wake(false); render(); break;
    case 'warmup': openTimer('warmup', 'Warm-up bike', 'runner'); timerLoop(); break;
    case 'step': { const l = listOf(ctx, id), f = b.dataset.f as 'w' | 'r', d = +b.dataset.d!; const s = l[i];
      if (S.sound) navigator.vibrate?.(10); s[f] = Math.max(0, Math.round((s[f] + d) * 100) / 100); l.forEach((x, j) => { if (j > i && !x.done) x[f] = s[f]; }); await persist(ctx); keepScroll(render); break; }
    case 'done': { const l = listOf(ctx, id), s = l[i]; s.done = !s.done; await persist(ctx); if (s.done) { popKey = `${ctx}${id}${i}`; if (S.sound) navigator.vibrate?.(35); }
      if (s.done) { if (ctx === 'r') { const g = groupsOf(draft!)[+b.dataset.g!]; if (id === g[g.length - 1]) startRest(); }
        else if (ex(id).kind !== 'cardio' && i < l.length - 1) startRest();
        const pr = best(id); if (pr > 0 && score(ex(id), s) > pr) { beep(1320, 120, 2); toast('🏆 New PR!'); } else beep(700, 80); }
      keepScroll(render); break; }
    case 'setadd': { const l = listOf(ctx, id); const last = l[l.length - 1]; l.push({ w: last.w, r: last.r, done: false }); await persist(ctx); keepScroll(render); break; }
    case 'setrm': { const l = listOf(ctx, id); if (l.length > 1) l.pop(); await persist(ctx); keepScroll(render); break; }
    case 'swap': swapFor = id; render(); break;
    case 'swapx': swapFor = null; render(); break;
    case 'swapto': { const d = draft!, from = swapFor!; swapFor = null; if (d.ex[id]) return render();
      d.groups = groupsOf(d).map(g => g.map(x => (x === from ? id : x))); const f = prefill(id, d.ex[from].length, p.deload); d.ex[id] = f.sets; d.hints[id] = f.hint; delete d.ex[from];
      await put('kv', d, 'draft'); toast(`Swapped to ${ex(id).name}`); render(); break; }
    case 'rest+': restEnd += 15000; restDur += 15000; render(); break;
    case 'restskip': restEnd = 0; keepScroll(render); break;
    case 'finish': { const d = draft!; if (!Object.values(d.ex).some(l => l.some(x => x.done)) && !confirm('No sets ticked. Finish anyway?')) return;
      await saveSession({ id: crypto.randomUUID(), date: d.date, type: 'strength', title: d.title, ex: d.ex, order: groupsOf(d).flat(), mins: Math.round((Date.now() - d.started) / 60000), finished: Date.now() });
      draft = null; await del('kv', 'draft'); restEnd = 0; mode = 'tabs'; tab = 'today'; wake(false); toast('Workout saved 💪'); render(); break; }
    // quick log
    case 'qtoggle': { if (!Q) return; if (Q.ex[id]) { delete Q.ex[id]; Q.order = Q.order.filter(x => x !== id); } else addQ(id); await put('kv', Q, 'quick');
      const y = scrollY; render(); scrollTo(0, y); break; }
    case 'qrm': { const keep = Q!.ex[id]; delete Q!.ex[id]; Q!.order = Q!.order.filter(x => x !== id); await put('kv', Q, 'quick'); keepScroll(render);
      toast(`Removed ${ex(id).name}`, async () => { Q!.ex[id] = keep; Q!.order.push(id); await put('kv', Q, 'quick'); render(); }); break; }
    case 'qback': mode = 'tabs'; restEnd = 0; render(); break;
    case 'qsave': { const q = Q!; const exs: Record<string, SetLog[]> = {};
      for (const k of q.order) { const l = q.ex[k]; exs[k] = l.some(x => x.done) ? l : l.map(x => ({ ...x, done: true })); } // untouched = assume done as shown
      const mins = Math.round((Date.now() - q.started) / 60000);
      const cmin = q.order.filter(k => ex(k).kind === 'cardio').reduce((a, k) => a + exs[k].reduce((b, x) => b + x.r, 0), 0);
      await saveSession({ id: crypto.randomUUID(), date: today(), type: 'quick', title: q.title || 'Workout', ex: exs, order: q.order, mins: Math.max(cmin, Math.min(mins, 90)) || undefined, finished: Date.now() });
      Q = null; await del('kv', 'quick'); restEnd = 0; mode = 'tabs'; tab = 'today'; toast('Logged 💪'); render(); break; }
    case 'again': { const s = sessions.find(x => x.id === id)!; Q = { title: s.title, ex: {}, order: [], started: Date.now(), q: '' };
      for (const k of s.order || Object.keys(s.ex!)) { const l = s.ex![k].filter(x => x.done); if (l.length) { Q.ex[k] = l.map(x => ({ ...x, done: false })); Q.order.push(k); } }
      await put('kv', Q, 'quick'); mode = 'quick'; render(); scrollTo(0, 0); break; }
    // library
    case 'muscle': libM = libM === id ? null : (id as Muscle); keepScroll(render); break;
    case 'build': await openQuick(build30(id as Muscle)); toast('Workout built – adjust and tick as you go'); break;
    case 'addtoday': { if (!Q) Q = { title: 'Workout', ex: {}, order: [], started: Date.now(), q: '' };
      if (Q.ex[id]) { toast('Already in today’s log'); return; } addQ(id); await put('kv', Q, 'quick');
      toast(`Added ${ex(id).name} – open “What did you do?”`); if ((mode as string) === 'detail') { mode = 'quick'; render(); scrollTo(0, 0); } else keepScroll(render); break; }
    case 'info': detailBack = (mode as string) === 'detail' ? detailBack : (mode as typeof detailBack); detailId = id; mode = 'detail'; render(); scrollTo(0, 0); break;
    case 'dback': mode = (detailBack as string) === 'detail' ? 'tabs' : detailBack; render(); break;
    // timer
    case 'tback': mode = tm!.back; if (mode === 'tabs') wake(false); tm = null; render(); break;
    case 'tgo': { const t = tm!; ac ??= new AudioContext(); if (t.running) { t.running = false; t.left = (t.end - Date.now()) / 1000; } else { t.running = true; t.startedAt ||= Date.now(); t.end = Date.now() + t.left * 1000; beep(880, 120); } render(); break; }
    case 'tskip': { const t = tm!; if (t.i < t.phases.length - 1) { t.i++; t.left = t.phases[t.i].secs; t.end = Date.now() + t.left * 1000; } else { t.running = false; t.left = 0; } render(); break; }
    case 'tsave': { const t = tm!; const mins = Math.max(1, Math.round((t.phases.reduce((a, q) => a + q.secs, 0) - totalLeft()) / 60));
      const eid = t.kind === 'intervals' ? 'bikeint' : t.kind === 'easy' ? 'walk' : 'bikesteady';
      await saveSession({ id: crypto.randomUUID(), date: today(), type: t.kind, title: t.title, ex: { [eid]: [{ w: 0, r: mins, done: true }] }, order: [eid], mins, finished: Date.now() }); tm = null; mode = 'tabs'; wake(false); toast('Ride saved 🚲'); render(); break; }
    // check-in / body
    case 'ck-protein': await saveCheckin({ protein: !(checkins[today()]?.protein) }); render(); break;
    case 'ck-sleep': { const c = checkins[today()]; await saveCheckin({ sleep: (c?.sleep || 0) >= 7 ? 0 : Math.max(7, c?.sleep || 0) }); render(); break; }
    case 'scoop': { const g = (checkins[today()]?.grams || 0) + S.scoop; await saveCheckin({ grams: g, protein: g >= 130 || checkins[today()]?.protein }); toast(`+${S.scoop} g protein`); render(); break; }
    case 'savebody': { const w = +(($('#bw') as HTMLInputElement)?.value || 0), wa = +(($('#bwa') as HTMLInputElement)?.value || 0); if (!w && !wa) return;
      const e2 = body.find(x => x.date === today()) || { date: today() }; if (w) e2.weight = w; if (wa) e2.waist = wa; await put('body', e2); body = (await all<Body>('body')).sort((x, y) => x.date.localeCompare(y.date)); toast('Saved'); render(); break; }
    case 'delsess': { const s = sessions.find(x => x.id === id)!; await del('sessions', id); sessions = sessions.filter(x => x.id !== id); keepScroll(render);
      toast(`Deleted ${s.title}`, async () => { await saveSession(s); render(); }); break; }
    case 'tip': { const w = b.closest('.chartw') as HTMLElement, t = w.querySelector('.tip') as HTMLElement; w.querySelectorAll('.hit.on').forEach(x => x.classList.remove('on')); b.classList.add('on');
      t.textContent = b.dataset.tip!; t.style.left = b.dataset.x + '%'; t.style.top = b.dataset.y + '%'; t.style.setProperty('--tc', b.dataset.c!); t.classList.add('show'); break; }
    case 'theme': S.theme = id as any; await put('kv', S, 'settings'); applyTheme(); render(); break;
    case 'pex': progEx = id; keepScroll(render); break;
    case 'sound': S.sound = !S.sound; await put('kv', S, 'settings'); render(); break;
    case 'rotate': S.rotate = !S.rotate; await put('kv', S, 'settings'); render(); break;
    case 'saveset': S.start = ($('#s-start') as HTMLInputElement).value || S.start; S.deloadEvery = Math.max(0, +($('#s-dl') as HTMLInputElement).value || 0);
      S.scoop = +($('#s-sc') as HTMLInputElement).value || S.scoop; S.rest = Math.max(15, +($('#s-rest') as HTMLInputElement).value || 60); await put('kv', S, 'settings'); toast('Settings saved'); render(); break;
    case 'export': { const blob = new Blob([JSON.stringify(await exportAll(), null, 1)], { type: 'application/json' }); const u = URL.createObjectURL(blob); const l = document.createElement('a'); l.href = u; l.download = `fit-backup-${today()}.json`; l.click(); setTimeout(() => URL.revokeObjectURL(u), 2000); break; }
  }
});

(async () => {
  await load();
  if (location.hash === '#demo') { const dm = Object.values(import.meta.glob('./demo.ts'))[0]; if (dm) { const { seed } = await dm() as any; await seed(S); } await load(); history.replaceState(null, '', location.pathname); }
  applyTheme(); timerLoop(); render();
  if ('serviceWorker' in navigator && import.meta.env.PROD) navigator.serviceWorker.register('./sw.js');
})();
(window as any).__fit = { openTimer: (k: any, t: string) => { openTimer(k, t); timerLoop(); }, startStrength, info: (id: string) => { detailId = id; detailBack = 'tabs'; mode = 'detail'; render(); } };
