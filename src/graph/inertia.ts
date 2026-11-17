export interface PanSample {
  /** performance.now() timestamp. */
  t: number;
  x: number;
  y: number;
}

export interface PanVelocity {
  vx: number;
  vy: number;
}

/** Ignore releases slower than this so a tap or a pause does not glide. */
export const INERTIA_MIN_START_SPEED = 0.12;
/** Stop the animation once the viewport moves slower than this. */
export const INERTIA_MIN_SPEED = 0.02;
/** Cap a fast fling so it cannot cross the whole graph in one gesture. */
export const INERTIA_MAX_SPEED = 3;
/** Retain this fraction of the velocity per 16.67ms frame. */
export const INERTIA_FRICTION = 0.92;

const FRAME_MS = 1000 / 60;
const STALE_MS = 100;

export function speedOf(v: PanVelocity): number {
  return Math.hypot(v.vx, v.vy);
}

/** Velocity of the last ~80ms of a drag, ignoring the slower start. */
export function dragVelocity(
  samples: readonly PanSample[],
  now: number,
  windowMs = 80
): PanVelocity {
  if (samples.length < 2) return { vx: 0, vy: 0 };
  const end = samples[samples.length - 1];
  if (now - end.t > STALE_MS) return { vx: 0, vy: 0 };

  let startIndex = samples.length - 1;
  for (let i = samples.length - 2; i >= 0; i--) {
    if (end.t - samples[i].t > windowMs) break;
    startIndex = i;
  }
  if (startIndex === samples.length - 1) return { vx: 0, vy: 0 };
  const start = samples[startIndex];
  const dt = end.t - start.t;
  if (dt <= 0) return { vx: 0, vy: 0 };
  return { vx: (end.x - start.x) / dt, vy: (end.y - start.y) / dt };
}

export function clampVelocity(
  v: PanVelocity,
  max = INERTIA_MAX_SPEED
): PanVelocity {
  const speed = speedOf(v);
  if (speed === 0 || speed <= max) return v;
  const scale = max / speed;
  return { vx: v.vx * scale, vy: v.vy * scale };
}

export function decayVelocity(v: PanVelocity, dt: number): PanVelocity {
  const factor = Math.pow(INERTIA_FRICTION, Math.max(0, dt) / FRAME_MS);
  return { vx: v.vx * factor, vy: v.vy * factor };
}
