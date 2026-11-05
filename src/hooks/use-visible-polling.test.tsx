import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { useVisiblePolling } from "./use-visible-polling";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});
it("não sobrepõe requisições, pausa em segundo plano e retoma no foco", async () => {
  vi.useFakeTimers();
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  let release!: () => void;
  const task = vi
    .fn()
    .mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    )
    .mockResolvedValue(undefined);
  renderHook(() => useVisiblePolling(task));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(task).toHaveBeenCalledTimes(1);
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(10000);
  });
  expect(task).toHaveBeenCalledTimes(1);
  await act(async () => {
    release();
    await Promise.resolve();
  });
  visibility.mockReturnValue("hidden");
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.advanceTimersByTimeAsync(20000);
  });
  expect(task).toHaveBeenCalledTimes(1);
  visibility.mockReturnValue("visible");
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
    await Promise.resolve();
  });
  expect(task).toHaveBeenCalledTimes(2);
});
