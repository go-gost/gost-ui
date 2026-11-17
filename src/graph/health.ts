export type Mood = "dead" | "error" | "warn" | "healthy" | "idle";

export interface Counters {
  errors: number;
  successes: number;
}

/**
 * errorRatio returns failures / (failures + successes), or null when there is
 * no traffic at all. `errors` counts failed attempts and `successes` counts
 * successful ones — they are disjoint and must not be collapsed into one total.
 */
export function errorRatio(c: Counters): number | null {
  const { errors, successes } = c;
  if (errors === 0 && successes === 0) {
    return null;
  }
  return errors / (errors + successes);
}

const DEAD_RATIO = 0.5;
const ERROR_RATIO = 0.05;
const WARN_RATIO = 0.01;

export function moodOf(c: Counters, dead = false): Mood {
  if (dead) {
    return "dead";
  }
  const ratio = errorRatio(c);
  if (ratio === null) {
    return "idle";
  }
  if (ratio >= DEAD_RATIO) {
    return "dead";
  }
  if (ratio > ERROR_RATIO) {
    return "error";
  }
  if (ratio >= WARN_RATIO) {
    return "warn";
  }
  return "healthy";
}

/** Short, untranslated label for a mood badge's title/aria-label. The state
 * token plus the error/total ratio is enough without adding i18n keys. */
export function moodBadgeLabel(mood: Mood, c?: Counters): string {
  if (mood === "idle") return "";
  if (!c) return mood;
  const total = c.errors + c.successes;
  return total === 0 ? mood : `${mood} ${c.errors}/${total}`;
}

export function quotaMood(q: {
  blocked?: boolean;
  expired?: boolean;
  used?: number;
}): Mood {
  if (q.blocked) {
    return "dead";
  }
  if (q.expired) {
    return "warn";
  }
  if (q.used && q.used > 0) {
    return "healthy";
  }
  return "idle";
}
