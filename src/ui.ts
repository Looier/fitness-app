// v2.1 design helpers: inline SVG icon set, rings, empty states, gradient defs
const sv = (p: string) => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const F = (d: string) => `<path fill="currentColor" stroke="none" d="${d}"/>`;
export const I = {
  home: sv('<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
  dumbbell: sv('<path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" stroke-width="2.4"/>'),
  log: sv('<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4" cy="6" r="1.2" fill="currentColor"/><circle cx="4" cy="12" r="1.2" fill="currentColor"/><circle cx="4" cy="18" r="1.2" fill="currentColor"/>'),
  chart: sv('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-7"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  flame: sv(F('M12 2c1 3.5 5.5 5.5 5.5 11a5.5 5.5 0 0 1-11 0c0-2.7 1.6-4.4 2.7-5.4.3 2 1.2 3 2.4 3.4C11 8 10.6 5.5 12 2z')),
  play: sv(F('M7 4.5v15a1 1 0 0 0 1.5.9l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z')),
  pause: sv('<path d="M8 5v14M16 5v14" stroke-width="3.2"/>'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="3"/>'),
  plus: sv('<path d="M12 5v14M5 12h14" stroke-width="2.6"/>'),
  minus: sv('<path d="M5 12h14" stroke-width="2.6"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  swap: sv('<path d="M4 8h15l-4-4M20 16H5l4 4"/>'),
  back: sv('<path d="m15 5-7 7 7 7" stroke-width="2.6"/>'),
  search: sv('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>'),
  bolt: sv(F('M13 2 4 14h7l-1 8 9-12h-7z')),
  bike: sv('<circle cx="5.5" cy="16.5" r="3.5"/><circle cx="18.5" cy="16.5" r="3.5"/><path d="M5.5 16.5 9 9h6l3.5 7.5M9 9l3.5 7.5M13.5 5.5H16"/>'),
  walk: sv('<circle cx="13" cy="4" r="2"/><path d="m9 21 3-7 3 3v4M7 12l3-5 4 1 3 4M12 14l-1.5-6"/>'),
  moon: sv('<path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"/>'),
  trophy: sv('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/>'),
  edit: sv('<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>'),
  repeat: sv('<path d="M17 2l3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"/>'),
  info: sv('<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'),
  star: sv(F('m12 2.5 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z')),
  scale: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><path d="M8 10a5 5 0 0 1 8 0M12 10l1.5-2"/>'),
  sun: sv('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>'),
  body: sv('<circle cx="12" cy="4.5" r="2.2"/><path d="M5 8.5h14M12 8.5v6M8.5 22l3.5-7.5 3.5 7.5"/>'),
  bell: sv('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>'),
  down: sv('<path d="M12 4v12M6 11l6 6 6-6M5 21h14"/>'),
  up: sv('<path d="M12 20V8M6 13l6-6 6 6M5 3h14"/>'),
};
/** progress ring; f = 0..1. id goes on the value circle so a ticker can move it */
export function ring(f: number, size: number, sw: number, cls: string, inner = '', id = '') {
  const r = (size - sw) / 2, c = size / 2, off = 100 - Math.max(0, Math.min(1, f || 0)) * 100;
  return `<div class="ring ${cls}" style="--s:${size}px"><svg viewBox="0 0 ${size} ${size}"><circle class="rt" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}"/><circle class="rv" ${id ? `id="${id}"` : ''} cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${off}" transform="rotate(-90 ${c} ${c})"/></svg><div class="ri">${inner}</div></div>`;
}
/** Apple-style concentric activity rings */
export function rings3(v: [number, string][], size = 136, sw = 14) {
  const c = size / 2; let g = '';
  v.forEach(([f, k], i) => { const r = c - sw / 2 - i * (sw + 3); const off = 100 - Math.max(0, Math.min(1, f || 0)) * 100;
    g += `<circle class="rt ${k}" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}"/><circle class="rv ${k}" cx="${c}" cy="${c}" r="${r}" stroke-width="${sw}" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${off}" transform="rotate(-90 ${c} ${c})"/>`; });
  return `<svg class="rings3" viewBox="0 0 ${size} ${size}" style="width:${size}px">${g}</svg>`;
}
export const empty = (ic: string, t: string, s = '') => `<div class="empty"><div class="eil"><span class="blob"></span>${ic}</div><b>${t}</b>${s ? `<small>${s}</small>` : ''}</div>`;
export const DEFS = `<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
<linearGradient id="gAcc" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="var(--a1)"/><stop offset="1" stop-color="var(--a2)"/></linearGradient>
<linearGradient id="gHot" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb020"/><stop offset=".5" stop-color="#ff5a36"/><stop offset="1" stop-color="#ff2d78"/></linearGradient>
<linearGradient id="gCool" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5eead4"/><stop offset="1" stop-color="#3b82f6"/></linearGradient>
<linearGradient id="gP" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff9f43"/><stop offset="1" stop-color="#ff2d78"/></linearGradient>
<linearGradient id="gS" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a78bfa"/><stop offset="1" stop-color="#4f7cff"/></linearGradient>
<linearGradient id="gT" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#d4ff3a"/><stop offset="1" stop-color="#1ad6b5"/></linearGradient>
</defs></svg>`;
/** colour per muscle group */
export const MC: Record<string, string> = { chest: '#ff6b6b', back: '#4f9dff', shoulders: '#ffb020', biceps: '#c77dff', triceps: '#9d7bff', core: '#ffd43b', glutes: '#ff5fa2', quads: '#2fd6a3', hamstrings: '#20c4e8', calves: '#7bdc5a', cardio: '#ff7a3d' };
