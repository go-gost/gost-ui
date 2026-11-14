import { useCallback, useEffect, useRef, useState } from "react";
import axios from "axios";
import { getDashboardSnapshot, type Snapshot } from "../../api/dashboard";
import { phaseForStatus, type SnapshotPhase } from "./status";

export const POLL_MS = 5000;

export interface SnapshotState {
  snapshot: Snapshot | null;
  phase: SnapshotPhase;
  error: string | null;
  updatedAt: number | null;
  refresh: () => void;
}

/**
 * Polls the dashboard snapshot. The tab being hidden pauses polling; it
 * resumes with an immediate fetch when the tab becomes visible again. A failed
 * request keeps the last snapshot and only changes the phase.
 */
export function useSnapshot(pollMs = POLL_MS): SnapshotState {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [phase, setPhase] = useState<SnapshotPhase>("loading");
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async () => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    try {
      const next = await getDashboardSnapshot(controller.signal);
      if (!mounted.current) return;
      setSnapshot(next);
      setPhase("live");
      setError(null);
      setUpdatedAt(Date.now());
    } catch (err) {
      if (!mounted.current || controller.signal.aborted) return;
      const status = axios.isAxiosError(err)
        ? err.response?.status
        : undefined;
      setPhase(phaseForStatus(status));
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void load();
    const timer = window.setInterval(() => {
      if (!document.hidden) void load();
    }, pollMs);
    const onVisible = () => {
      if (!document.hidden) void load();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      mounted.current = false;
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      abort.current?.abort();
    };
  }, [load, pollMs]);

  return { snapshot, phase, error, updatedAt, refresh: load };
}
