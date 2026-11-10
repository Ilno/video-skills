// The film, as film.json describes it. Every time is in seconds from the start of its scene; every x/y/w/h is in
// pixels of the capture it belongs to (open the PNG, read the pixel), so a pointer always lands on the real button.

import type { HubleadAppProps } from './hublead-app/hublead-app';

export type Capture = {
  /** a file in public/, e.g. "captures/dashboard.png"; leave empty when `app` is set */
  src?: string;
  /** the real Hublead dashboard, rendered live from its own components (sharp at any zoom); w/h are its size in CSS pixels */
  app?: Omit<HubleadAppProps, 'width' | 'height' | 'className' | 'style'>;
  /** its size in pixels */
  w: number;
  h: number;
};

/**
 * On a live app capture, `target` names what to aim at instead of x/y: the visible text of a button, tab or cell
 * ("Watch a segment", "Team", "Michael Johnson"), or a CSS selector after "css:" ("css:[data-slot=new-changes-badge]").
 */
export type Target = { target?: string };
export type CameraKey = Target & { t: number; x?: number; y?: number; zoom: number; tiltX?: number; tiltY?: number };
export type Click = Target & { t: number; x?: number; y?: number; from?: [number, number] };
/** from t on, show another capture, or change the live app (e.g. { tab: "team" }) */
export type Swap = { t: number; src?: string; app?: Partial<HubleadAppProps> };
export type Highlight = Target & { t: number; until?: number; x?: number; y?: number; w?: number; h?: number; pad?: number };

export type Popup = Capture & {
  t: number;
  until: number;
  /** its size on screen, as a share of its pixels (0.5 = half) */
  scale: number;
  clicks?: Click[];
  swaps?: Swap[];
};

export type TitleScene = { type: 'title'; seconds: number; text: string; capture?: Capture & { scale: number } };
export type BrandScene = { type: 'brand'; seconds: number; text: string };
export type ShotScene = {
  type: 'shot';
  seconds: number;
  /** the step pill above the shot; numbered automatically */
  step?: string;
  capture: Capture;
  /** where the camera looks (capture pixels) and how close: 1 = the capture's pixels at 1:1 on screen */
  camera: CameraKey[];
  clicks?: Click[];
  swaps?: Swap[];
  highlights?: Highlight[];
  popups?: Popup[];
  toast?: { t: number; until: number; text: string; x: number; y: number };
};
export type ChannelItem = Capture & { logo: string; name: string; seconds: number; scale?: number };
export type ChannelsScene = { type: 'channels'; step?: string; items: ChannelItem[] };
export type LockupScene = { type: 'lockup'; seconds: number; tagline: string };

export type Scene = TitleScene | BrandScene | ShotScene | ChannelsScene | LockupScene;

export type FilmSpec = {
  /** the track in public/ (scripts/music.mjs downloads it there); the film ends on its last second */
  music?: string;
  scenes: Scene[];
};

export const sceneSeconds = (s: Scene) => (s.type === 'channels' ? s.items.reduce((a, i) => a + i.seconds, 0) : s.seconds);
