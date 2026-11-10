import '@fontsource-variable/inter';
import React from 'react';
import { AbsoluteFill, Audio, continueRender, delayRender, Easing, Img, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion';
import { HubleadApp, type HubleadAppProps } from './hublead-app/hublead-app';
import './hublead-app/hublead-app.css';
import { type CameraKey, type Capture, type ChannelItem, type Click, type FilmSpec, type Highlight, type Popup, type Scene, sceneSeconds, type Swap } from './spec';

// Hublead's art direction: the brand's warped gradient (violet, orchid, coral) with grain, Inter, the real wordmark,
// real product captures floating in 3D, a pointer that clicks the real buttons. Built on cinetic (MIT, Leonxlnx).
export const FPS = 30;
const OVERLAP = 0.5; // seconds two scenes share (the out-going one blurs away while the next one lands)
const INTER = '"Inter Variable", system-ui, sans-serif';
const WHITE = '#FFFFFF';
const INK = '#16112B';
const LINE = '#E8E6EF';

const OUT = Easing.bezier(0.16, 1, 0.3, 1);
const INOUT = Easing.bezier(0.65, 0, 0.35, 1);
const IN = Easing.bezier(0.55, 0.05, 0.75, 0.3);
/** 0 -> 1 between seconds a and b */
const p = (t: number, a: number, b: number, e: 'out' | 'inout' | 'in' = 'out') =>
  interpolate(t, [a, b], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: e === 'out' ? OUT : e === 'in' ? IN : INOUT });
const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const src = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));

export type FilmProps = { spec: FilmSpec; musicFrom: number };

export const filmFrames = (spec: FilmSpec) => {
  const total = spec.scenes.reduce((a, s) => a + sceneSeconds(s), 0) - OVERLAP * Math.max(0, spec.scenes.length - 1);
  return Math.max(1, Math.round(total * FPS));
};

// ---------------------------------------------------------------- stage

const BLOBS: [number, number, number, string, number][] = [
  [70, 230, 170, '93 56 226', 0.95],
  [300, 260, 140, '192 89 255', 0.85],
  [470, 170, 120, '251 130 92', 0.8],
  [190, 40, 90, '139 92 246', 0.7],
  [420, 20, 70, '205 122 255', 0.55],
];

// The violet backdrop: soft blobs, blurred and warped by an SVG filter. The filter runs on a 480 x 270 canvas that CSS
// scales x4: run on the full 1080p frame, the turbulence cost about 15 s a frame in a CPU-only Chrome (a 45 s film took
// hours on the VM); the result is a blur, so the lower resolution does not show.
const Stage: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS;
  const canvas = React.useRef<HTMLCanvasElement>(null);
  const id = `warp-${React.useId().replace(/:/g, '')}`;
  React.useLayoutEffect(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 480, 270);
    ctx.filter = `url(#${id})`;
    // the filter reads one layer: draw the blobs on a scratch canvas, then draw that through the filter
    const layer = document.createElement('canvas');
    layer.width = 480;
    layer.height = 270;
    const l = layer.getContext('2d')!;
    BLOBS.forEach(([cx, cy, r, rgb, o], i) => {
      l.globalAlpha = o;
      l.fillStyle = `rgb(${rgb})`;
      l.beginPath();
      l.arc(cx + 26 * Math.sin(t * 0.3 + i * 1.7), cy + 18 * Math.cos(t * 0.26 + i * 2.1), r, 0, Math.PI * 2);
      l.fill();
    });
    ctx.drawImage(layer, 0, 0);
    ctx.filter = 'none';
  }, [t, id]);
  return (
    <AbsoluteFill style={{ background: '#160B33' }}>
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <filter id={id} x="-50%" y="-50%" width="200%" height="200%" colorInterpolationFilters="sRGB">
            <feGaussianBlur in="SourceGraphic" stdDeviation="34" result="soft" />
            <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="7" result="noise" />
            <feDisplacementMap in="soft" in2="noise" scale="90" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
      <canvas ref={canvas} width={480} height={270} style={{ position: 'absolute', left: 0, top: 0, width: 480, height: 270, transform: 'scale(4)', transformOrigin: '0 0' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(22,11,51,0) 0%, rgba(22,11,51,0.55) 100%)' }} />
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile(`brand/grain${Math.floor(f / 2) % 4}.png`)})`, backgroundSize: '256px 256px', backgroundPosition: `${(f * 37) % 512}px ${(f * 61) % 512}px`, mixBlendMode: 'overlay', opacity: 0.55 }} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- pieces

const fade = (t: number, dur: number) => {
  const i = p(t, 0, 0.55);
  const o = 1 - p(t, dur - OVERLAP, dur, 'in');
  return { o: i * o, blur: 14 * (1 - i) + 16 * (1 - o), i };
};

const Title: React.FC<{ t: number; dur: number; text: string; size: number; y: number }> = ({ t, dur, text, size, y }) => {
  const { o, blur, i } = fade(t, dur);
  return (
    <div style={{ position: 'absolute', left: 0, width: 1920, top: y - size * 0.62, textAlign: 'center', fontFamily: INTER, fontWeight: 650, fontSize: size, letterSpacing: '-0.035em', lineHeight: 1.06, color: WHITE, whiteSpace: 'pre-line', opacity: o, transform: `translateY(${mix(36, 0, i)}px)`, filter: `blur(${blur.toFixed(2)}px)`, textShadow: '0 8px 40px rgba(22,11,51,0.35)' }}>
      {text}
    </div>
  );
};

const StepPill: React.FC<{ t: number; dur: number; n: number; text: string }> = ({ t, dur, n, text }) => {
  const i = p(t, 0.1, 0.55);
  const o = 1 - p(t, dur - OVERLAP, dur - 0.2, 'in');
  return (
    <div style={{ position: 'absolute', left: 0, width: 1920, top: 54, display: 'flex', justifyContent: 'center', opacity: i * o, transform: `translateY(${mix(-20, 0, i)}px)`, zIndex: 50 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '12px 32px 12px 12px', borderRadius: 999, background: 'rgba(30,16,70,0.8)', border: '1px solid rgba(255,255,255,0.22)', boxShadow: '0 18px 50px rgba(22,11,51,0.35)' }}>
        <div style={{ width: 54, height: 54, borderRadius: 27, background: WHITE, color: '#5D38E2', fontFamily: INTER, fontWeight: 700, fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
        <div style={{ fontFamily: INTER, fontWeight: 620, fontSize: 44, letterSpacing: '-0.025em', color: WHITE }}>{text}</div>
      </div>
    </div>
  );
};

// The dashboard runs some animations on its own clock: chart lines draw themselves (Recharts), panels fade in. A
// frame taken soon after the app mounted caught them half drawn (empty or half charts), and which frames did depended
// on how busy the machine was. So each time the app mounts, rendering waits at least MIN_SETTLE_MS (a chart can start
// drawing a second after mount, once its container is measured), then until the fonts are in and the app's DOM has not
// changed for QUIET_MS (at most MAX_SETTLE_MS), and the app's CSS animations and transitions are switched off.
const MIN_SETTLE_MS = 2500;
const QUIET_MS = 600;
const MAX_SETTLE_MS = 10000;
const SETTLE_CSS = '.film-live-app *, .film-live-app *::before, .film-live-app *::after { animation: none !important; transition: none !important; }';

const LiveApp: React.FC<HubleadAppProps> = (props) => {
  const root = React.useRef<HTMLDivElement>(null);
  const [handle] = React.useState(() => delayRender('letting the dashboard settle (charts, fonts)', { timeoutInMilliseconds: MAX_SETTLE_MS + 20000 }));
  React.useEffect(() => {
    let done = false;
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const end = () => {
      if (done) return;
      done = true;
      clearTimeout(quiet);
      clearTimeout(cap);
      observer.disconnect();
      continueRender(handle);
    };
    const start = Date.now();
    const arm = () => {
      clearTimeout(quiet);
      const wait = Math.max(QUIET_MS, MIN_SETTLE_MS - (Date.now() - start));
      quiet = setTimeout(() => document.fonts.ready.then(end), wait);
    };
    const observer = new MutationObserver(arm);
    if (root.current) observer.observe(root.current, { subtree: true, childList: true, attributes: true, characterData: true });
    const cap = setTimeout(() => {
      console.warn(`[film] the dashboard was still moving after ${MAX_SETTLE_MS / 1000} s: frames may show it half drawn`);
      end();
    }, MAX_SETTLE_MS);
    arm();
    return end;
  }, [handle]);
  return (
    <div className="film-live-app" ref={root} style={{ width: '100%', height: '100%' }}>
      <style>{SETTLE_CSS}</style>
      <HubleadApp {...props} />
    </div>
  );
};

const Shot: React.FC<{ capture: Capture; radius?: number }> = ({ capture, radius = 22 }) => {
  const { w, h } = capture;
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: w, height: h, borderRadius: radius, overflow: 'hidden', background: WHITE, boxShadow: '0 70px 160px rgba(22,11,51,0.55), 0 10px 30px rgba(22,11,51,0.3)' }}>
      {capture.app ? (
        <LiveApp key={seedKey(capture.app)} {...capture.app} width={w} height={h} />
      ) : (
        <Img src={src(capture.src ?? '')} style={{ width: w, height: h, display: 'block' }} />
      )}
    </div>
  );
};

// the app's sample data is seeded once; a swap that changes it remounts the app
const seedKey = (a: NonNullable<Capture['app']>) => JSON.stringify([a.page, a.crm, a.user, a.changes, a.stats, a.slack, a.sidebarCards]);

const swapped = (base: Capture, swaps: Swap[] | undefined, t: number): Capture =>
  (swaps ?? []).filter((s) => t >= s.t).reduce<Capture>((c, s) => (s.app && c.app ? { ...c, app: { ...c.app, ...s.app } } : s.src ? { ...c, src: s.src, app: undefined } : c), base);

// ---------------------------------------------------------------- targets on the live app

type Box = { x: number; y: number; w: number; h: number };
type Resolved<T> = T & { x: number; y: number };

const ownText = (el: Element) => (el.textContent ?? '').replace(/\s+/g, ' ').trim();

const warnedTwice = new Set<string>();

/** Finds a target inside the app: the smallest element whose text is the label (else contains it), or a CSS selector. */
const findTarget = (root: HTMLElement, label: string): HTMLElement | null => {
  if (label.startsWith('css:')) return root.querySelector<HTMLElement>(label.slice(4));
  const all = [...root.querySelectorAll<HTMLElement>('button, a, [role=tab], [role=menuitem], [role=option], th, td, label, h1, h2, h3, p, span, div')];
  const exact = all.filter((el) => ownText(el) === label);
  // the same text in two places (a card title and a column header, the signed-in user and a table row): the smallest
  // wins, which may not be the one the film means; say so once, a css: selector settles it
  const places = exact.filter((el) => !exact.some((o) => o !== el && el.contains(o)));
  if (places.length > 1 && !warnedTwice.has(label)) {
    warnedTwice.add(label);
    console.warn(`[film] target "${label}" is on screen ${places.length} times, the smallest one is used: aim with a css: selector`);
  }
  const loose = exact.length ? exact : all.filter((el) => ownText(el).includes(label));
  const pick = loose.sort((a, b) => a.offsetWidth * a.offsetHeight - b.offsetWidth * b.offsetHeight)[0];
  return pick ? (pick.closest<HTMLElement>('button, a, [role=tab], [role=menuitem]') ?? pick) : null;
};

/** Its box in the capture's own pixels: measured with the camera's transform lifted for an instant, so dialogs count too. */
const measure = (root: HTMLElement, labels: string[]): Record<string, Box> => {
  const saved = root.style.transform;
  root.style.transform = 'none';
  const r = root.getBoundingClientRect();
  const out: Record<string, Box> = {};
  for (const label of labels) {
    const el = findTarget(root, label);
    if (!el) continue;
    const b = el.getBoundingClientRect();
    out[label] = { x: b.left - r.left, y: b.top - r.top, w: b.width, h: b.height };
  }
  root.style.transform = saved;
  return out;
};

/** Measures every target of a scene in the rendered app, waiting (a few frames at most) for those that mount late. */
const useTargets = (ref: React.RefObject<HTMLDivElement | null>, labels: string[]) => {
  const [boxes, setBoxes] = React.useState<Record<string, Box>>({});
  React.useLayoutEffect(() => {
    const root = ref.current;
    if (!root || !labels.length) return;
    let tries = 0;
    let raf = 0;
    const handle = delayRender('measuring targets');
    const tick = () => {
      const next = measure(root, labels);
      const missing = labels.filter((l) => !next[l]);
      if (missing.length && tries++ < 30) {
        raf = requestAnimationFrame(tick);
        return;
      }
      if (missing.length) console.warn(`[film] target not found: ${missing.map((m) => `"${m}"`).join(', ')}`);
      setBoxes((prev) => (JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
      continueRender(handle);
    };
    tick();
    return () => {
      cancelAnimationFrame(raf);
      continueRender(handle);
    };
  });
  return boxes;
};

const place = <T extends { target?: string; x?: number; y?: number }>(item: T, boxes: Record<string, Box>, w: number, h: number): Resolved<T> => {
  const b = item.target ? boxes[item.target] : undefined;
  return { ...item, x: item.x ?? (b ? b.x + b.w / 2 : w / 2), y: item.y ?? (b ? b.y + b.h / 2 : h / 2) };
};

const boxAt = (hl: Highlight, boxes: Record<string, Box>): Box | null => {
  const b = hl.target ? boxes[hl.target] : undefined;
  const pad = hl.pad ?? 8;
  if (b) return { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad };
  return hl.x !== undefined && hl.y !== undefined && hl.w !== undefined && hl.h !== undefined ? { x: hl.x, y: hl.y, w: hl.w, h: hl.h } : null;
};

const camAt = (t: number, keys: Resolved<CameraKey>[]) => {
  const k = [...keys].sort((a, b) => a.t - b.t);
  const at = (c: Resolved<CameraKey>) => ({ x: c.x, y: c.y, z: c.zoom, rx: c.tiltX ?? 0, ry: c.tiltY ?? 0 });
  if (t <= k[0].t) return at(k[0]);
  for (let i = 1; i < k.length; i++) {
    if (t <= k[i].t) {
      const a = at(k[i - 1]);
      const b = at(k[i]);
      const e = INOUT((t - k[i - 1].t) / (k[i].t - k[i - 1].t));
      return { x: mix(a.x, b.x, e), y: mix(a.y, b.y, e), z: Math.exp(mix(Math.log(a.z), Math.log(b.z), e)), rx: mix(a.rx, b.rx, e), ry: mix(a.ry, b.ry, e) };
    }
  }
  return at(k[k.length - 1]);
};

/** The pointer glides in from `from` over 0.6 s, presses on t, a ring spreads from the tip. Capture pixels; `size` scales it. */
const Pointer: React.FC<{ t: number; clicks: Resolved<Click>[]; size: number }> = ({ t, clicks, size }) => {
  const c = [...clicks].sort((a, b) => a.t - b.t).filter((k) => t >= k.t - 0.9 && t <= k.t + 0.6).pop();
  if (!c) return null;
  const from = c.from ?? [c.x + 220 * size, c.y + 170 * size];
  const g = p(t, c.t - 0.75, c.t - 0.1, 'inout');
  const x = mix(from[0], c.x, g);
  const y = mix(from[1], c.y, g);
  const press = t >= c.t && t < c.t + 0.22 ? Math.sin(((t - c.t) / 0.22) * Math.PI) : 0;
  const ring = t >= c.t ? (t - c.t) / 0.5 : -1;
  const o = p(t, c.t - 0.9, c.t - 0.7) * (1 - p(t, c.t + 0.4, c.t + 0.6, 'in'));
  return (
    <>
      {ring >= 0 && ring < 1 && <div style={{ position: 'absolute', left: c.x - 30 * size, top: c.y - 30 * size, width: 60 * size, height: 60 * size, borderRadius: '50%', border: `${3 * size}px solid #7D60E8`, opacity: (1 - ring) * 0.8, transform: `scale(${mix(0.3, 1.4, ring)})` }} />}
      <svg width={34 * size} height={34 * size} viewBox="0 0 24 24" style={{ position: 'absolute', left: x - 5 * size, top: y - 3 * size, opacity: o, transform: `scale(${(1 - 0.18 * press).toFixed(3)})`, transformOrigin: `${5 * size}px ${3 * size}px`, filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.35))' }}>
        <path d="M5 3l14 8-6.2 1.6L9.6 19z" fill={INK} stroke={WHITE} strokeWidth={1.6} strokeLinejoin="round" />
      </svg>
    </>
  );
};

const Highlights: React.FC<{ t: number; items?: Highlight[]; boxes: Record<string, Box> }> = ({ t, items, boxes }) => (
  <>
    {(items ?? []).map((h, i) => {
      const on = p(t, h.t, h.t + 0.4) * (1 - (h.until ? p(t, h.until, h.until + 0.4) : 0));
      const b = boxAt(h, boxes);
      if (!b) return null;
      return <div key={i} style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, borderRadius: 14, border: `4px solid rgba(93,56,226,${on.toFixed(3)})`, background: `rgba(93,56,226,${(0.06 * on).toFixed(3)})`, transform: `scale(${mix(1.03, 1, on)})` }} />;
    })}
  </>
);

const PopupView: React.FC<{ t: number; pop: Popup }> = ({ t, pop }) => {
  const i = p(t, pop.t, pop.t + 0.5);
  const o = 1 - p(t, pop.until - 0.4, pop.until, 'in');
  if (i <= 0 || o <= 0) return null;
  const s = pop.scale;
  return (
    <div style={{ position: 'absolute', left: 960 - (pop.w * s) / 2, top: 590 - (pop.h * s) / 2, width: pop.w * s, height: pop.h * s, transform: `scale(${(mix(0.9, 1, i) * mix(1.04, 1, o)).toFixed(4)}) translateY(${mix(40, 0, i)}px)`, opacity: i * o, filter: `blur(${(8 * (1 - i) + 8 * (1 - o)).toFixed(2)}px)`, zIndex: 20 }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: pop.w, height: pop.h, transformOrigin: '0 0', transform: `scale(${s})` }}>
        <Shot capture={swapped(pop, pop.swaps, t)} radius={20} />
        <Pointer t={t} clicks={(pop.clicks ?? []).map((k) => place(k, {}, pop.w, pop.h))} size={1 / s} />
      </div>
    </div>
  );
};

// ---------------------------------------------------------------- scenes

const ShotView: React.FC<{ t: number; s: Extract<Scene, { type: 'shot' }>; n: number }> = ({ t, s, n }) => {
  const { o, blur } = fade(t, s.seconds);
  const ref = React.useRef<HTMLDivElement>(null);
  const labels = [...new Set([...s.camera, ...(s.clicks ?? []), ...(s.highlights ?? [])].flatMap((k) => (k.target ? [k.target] : [])))];
  const boxes = useTargets(ref, labels);
  const { w, h } = s.capture;
  const c = camAt(t, s.camera.map((k) => place(k, boxes, w, h)));
  const dim = Math.max(0, ...(s.popups ?? []).map((q) => p(t, q.t, q.t + 0.4) * (1 - p(t, q.until - 0.4, q.until))));
  const toast = s.toast ? p(t, s.toast.t, s.toast.t + 0.35) * (1 - p(t, s.toast.until - 0.3, s.toast.until, 'in')) : 0;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ perspective: 2200, opacity: o, filter: `blur(${(blur + 6 * dim).toFixed(2)}px)` }}>
        <div ref={ref} style={{ position: 'absolute', left: 0, top: 0, width: s.capture.w, height: s.capture.h, transformOrigin: '0 0', transform: `translate(960px, 560px) rotateX(${c.rx.toFixed(2)}deg) rotateY(${c.ry.toFixed(2)}deg) scale(${c.z.toFixed(4)}) translate(${(-c.x).toFixed(2)}px, ${(-c.y).toFixed(2)}px)` }}>
          <Shot capture={swapped(s.capture, s.swaps, t)} />
          <Highlights t={t} items={s.highlights} boxes={boxes} />
          <Pointer t={t} clicks={(s.clicks ?? []).map((k) => place(k, boxes, w, h))} size={1 / c.z} />
          {s.toast && (
            <div style={{ position: 'absolute', left: s.toast.x, top: s.toast.y, opacity: toast, transform: `translateY(${mix(-16, 0, toast)}px) scale(${(1 / c.z).toFixed(3)})`, transformOrigin: '0 0', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 14, background: WHITE, border: `1px solid ${LINE}`, boxShadow: '0 12px 30px rgba(22,11,51,0.18)', fontFamily: INTER, fontWeight: 600, fontSize: 22, color: INK, whiteSpace: 'nowrap' }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: '#1F9D55', color: WHITE, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
              {s.toast.text}
            </div>
          )}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `rgba(8,4,24,${(0.4 * dim).toFixed(3)})` }} />
      {(s.popups ?? []).map((q, i) => <PopupView key={i} t={t} pop={q} />)}
      {s.step && <StepPill t={t} dur={s.seconds} n={n} text={s.step} />}
    </AbsoluteFill>
  );
};

/** One alert channel: its logo lands big, hands over to its window, the window plays, it leaves forward. */
const ChannelView: React.FC<{ t: number; item: ChannelItem }> = ({ t, item }) => {
  const pop = p(t, 0, 0.4);
  const settle = p(t, 0.4, 0.65, 'inout');
  const away = p(t, 0.6, 1.0, 'inout');
  const win = p(t, 0.65, 1.25);
  const out = p(t, item.seconds - 0.45, item.seconds, 'in');
  const ring = p(t, 0.13, 0.85);
  const fit = item.scale ?? Math.min(1300 / item.w, 760 / item.h, 1.4);
  const w = item.w * fit;
  const h = item.h * fit;
  return (
    <AbsoluteFill style={{ perspective: 2200 }}>
      {away < 1 && (
        <div style={{ position: 'absolute', left: 830, top: 340, width: 260, height: 260, opacity: pop * (1 - away), transform: `translate(${mix(0, -520, away)}px, ${mix(0, -300, away)}px) scale(${(mix(0.4, 1.12, pop) * mix(1, 1 / 1.12, settle) * mix(1, 0.3, away)).toFixed(4)})` }}>
          <div style={{ position: 'absolute', left: -60, top: -60, width: 380, height: 380, borderRadius: 120, border: '3px solid rgba(255,255,255,0.7)', opacity: 1 - ring, transform: `scale(${mix(0.7, 1.35, ring)})` }} />
          <div style={{ width: 260, height: 260, borderRadius: 64, background: WHITE, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 40px 100px rgba(22,11,51,0.5)' }}>
            <Img src={staticFile(`logos/${item.logo}.svg`)} style={{ width: 150, height: 150, objectFit: 'contain' }} />
          </div>
          <div style={{ position: 'absolute', left: -260, width: 780, top: 290, textAlign: 'center', fontFamily: INTER, fontWeight: 650, fontSize: 52, letterSpacing: '-0.03em', color: WHITE }}>{item.name}</div>
        </div>
      )}
      <div style={{ position: 'absolute', left: 960 - w / 2, top: 600 - h / 2, width: w, height: h, opacity: win * (1 - out), transform: `rotateX(${mix(18, 0, win).toFixed(2)}deg) translateY(${mix(120, 0, win)}px) scale(${(mix(0.82, 1, win) * mix(1, 1.08, out)).toFixed(4)})`, filter: `blur(${(10 * (1 - win) + 14 * out).toFixed(2)}px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: item.w, height: item.h, transformOrigin: '0 0', transform: `scale(${fit})` }}>
          <Shot capture={item} radius={22 / fit} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

const ChannelsView: React.FC<{ t: number; s: Extract<Scene, { type: 'channels' }>; n: number }> = ({ t, s, n }) => {
  let at = 0;
  const dur = sceneSeconds(s);
  return (
    <AbsoluteFill>
      {s.items.map((item, i) => {
        const a = at;
        at += item.seconds;
        const lt = t - a;
        return lt >= 0 && lt <= item.seconds ? <ChannelView key={i} t={lt} item={item} /> : null;
      })}
      {s.step && <StepPill t={t} dur={dur} n={n} text={s.step} />}
    </AbsoluteFill>
  );
};

const LockupView: React.FC<{ t: number; s: Extract<Scene, { type: 'lockup' }> }> = ({ t, s }) => {
  const m = p(t, 0.1, 0.8);
  const k = p(t, 0.5, 1.1);
  const creep = mix(1, 1.04, p(t, 0.2, s.seconds, 'inout'));
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${creep.toFixed(4)})` }}>
      <div style={{ opacity: m, transform: `translateY(${mix(30, 0, m)}px) scale(${mix(0.92, 1, m)})`, filter: `blur(${(10 * (1 - m)).toFixed(2)}px)` }}>
        <Img src={staticFile('brand/wordmark-white.svg')} style={{ width: 860, height: 860 * (100 / 442), display: 'block' }} />
      </div>
      <div style={{ marginTop: 40, fontFamily: INTER, fontWeight: 560, fontSize: 44, letterSpacing: '-0.02em', color: 'rgba(255,255,255,0.9)', opacity: k, transform: `translateY(${mix(16, 0, k)}px)` }}>{s.tagline}</div>
    </AbsoluteFill>
  );
};

const TitleView: React.FC<{ t: number; s: Extract<Scene, { type: 'title' }> }> = ({ t, s }) => {
  const { o, blur, i } = fade(t, s.seconds);
  const c = s.capture;
  return (
    <AbsoluteFill>
      <Title t={t} dur={s.seconds} text={s.text} size={c ? 92 : 112} y={c ? 220 : 540} />
      {c && (
        <div style={{ position: 'absolute', left: 960 - (c.w * c.scale) / 2, top: 360, width: c.w * c.scale, height: c.h * c.scale, opacity: o, filter: `blur(${blur.toFixed(2)}px)`, transform: `perspective(1800px) rotateX(${mix(18, 4, i)}deg) translateY(${mix(70, 0, i)}px) scale(${mix(0.92, 1.04, p(t, 0, s.seconds, 'inout'))})` }}>
          <div style={{ position: 'absolute', left: 0, top: 0, width: c.w, height: c.h, transformOrigin: '0 0', transform: `scale(${c.scale})` }}>
            <Shot capture={c} radius={22 / c.scale} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

const BrandView: React.FC<{ t: number; s: Extract<Scene, { type: 'brand' }> }> = ({ t, s }) => {
  const { o } = fade(t, s.seconds);
  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', left: 904, top: 280, opacity: o, transform: `scale(${mix(0.6, 1, p(t, 0, 0.7))}) rotate(${mix(-20, 0, p(t, 0, 0.7))}deg)` }}>
        <Img src={staticFile('brand/mark.svg')} style={{ width: 112, height: 128 }} />
      </div>
      <Title t={t} dur={s.seconds} text={s.text} size={110} y={600} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------- sound: recorded effects placed on the actions

type Hit = [number, string, number];
const SFX_FILE = (name: string) => staticFile(`sfx/${name}.wav`);

const sounds = (spec: FilmSpec): Hit[] => {
  const out: Hit[] = [];
  let at = 0;
  spec.scenes.forEach((s, i) => {
    if (i > 0) out.push([at, s.type === 'lockup' ? 'hit' : 'whoosh', s.type === 'lockup' ? 0.9 : 0.45]);
    if (s.type === 'shot') {
      for (const c of s.clicks ?? []) out.push([at + c.t, 'click', 0.9]);
      for (const q of s.popups ?? []) {
        out.push([at + q.t, 'pop', 0.5]);
        for (const c of q.clicks ?? []) out.push([at + c.t, 'click', 0.9]);
      }
      if (s.toast) out.push([at + s.toast.t, 'pop', 0.6]);
    }
    if (s.type === 'channels') {
      let a = at;
      for (const it of s.items) {
        out.push([a, 'hit', 0.5], [a + 0.7, 'land', 0.55]);
        a += it.seconds;
      }
    }
    at += sceneSeconds(s) - OVERLAP;
  });
  return out;
};

// ---------------------------------------------------------------- the film

export const Film: React.FC<FilmProps> = ({ spec, musicFrom }) => {
  const f = useCurrentFrame();
  const total = filmFrames(spec);
  let at = 0;
  let step = 0;
  let lastStep = '';
  const views = spec.scenes.map((s, i) => {
    const start = at;
    const dur = sceneSeconds(s);
    at += dur - OVERLAP;
    const label = (s.type === 'shot' || s.type === 'channels') && s.step ? s.step : '';
    if (label && label !== lastStep) step++;
    if (label) lastStep = label;
    const n = label ? step : 0;
    const t = f / FPS - start;
    if (t < 0 || t > dur) return null;
    return (
      <AbsoluteFill key={i}>
        {s.type === 'title' && <TitleView t={t} s={s} />}
        {s.type === 'brand' && <BrandView t={t} s={s} />}
        {s.type === 'shot' && <ShotView t={t} s={s} n={n} />}
        {s.type === 'channels' && <ChannelsView t={t} s={s} n={n} />}
        {s.type === 'lockup' && <LockupView t={t} s={s} />}
      </AbsoluteFill>
    );
  });
  return (
    <AbsoluteFill style={{ overflow: 'hidden', background: '#160B33' }}>
      {/* the app's own CSS transitions run on the wall clock: off, so every frame renders the same way */}
      <style>{'.hublead-app *, .hublead-app *::before, .hublead-app *::after { transition: none !important; animation: none !important; }'}</style>
      <Stage f={f} />
      {views}
      {spec.music && (
        <Audio
          src={staticFile(spec.music)}
          startFrom={musicFrom}
          volume={(fr) => interpolate(fr, [0, 8, total - 20, total], [0, 0.9, 0.9, 0.9], { extrapolateRight: 'clamp' })}
        />
      )}
      {sounds(spec).map(([t, name, vol], i) => (
        <Sequence key={i} from={Math.max(0, Math.round(t * FPS))} durationInFrames={60}>
          <Audio src={SFX_FILE(name)} volume={vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
