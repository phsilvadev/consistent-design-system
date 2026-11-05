"use client";
import { useEffect, useRef } from "react";
/** One request cycle at a time; pause in background and resume on focus. */
export function useVisiblePolling(
  task: (isActive: () => boolean) => Promise<void>,
  interval = 5000,
) {
  const latest = useRef(task);
  useEffect(() => {
    latest.current = task;
  }, [task]);
  useEffect(() => {
    let alive = true;
    let running = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function tick() {
      if (!alive || running) return;
      clearTimeout(timer);
      if (document.visibilityState !== "visible") return;
      running = true;
      try {
        await latest.current(() => alive);
      } catch {
        /* The task presents API failures in the UI. */
      } finally {
        running = false;
        if (alive) timer = setTimeout(tick, interval);
      }
    }
    function wake() {
      if (document.visibilityState === "visible") void tick();
      else clearTimeout(timer);
    }
    timer = setTimeout(tick, interval);
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("focus", wake);
    return () => {
      alive = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("focus", wake);
    };
  }, [interval]);
}
