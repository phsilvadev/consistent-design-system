import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { TrialBanner } from "./trial-banner";
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
it("exibe o prazo real e atualiza a contagem", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-06T12:00:00Z"));
  render(<TrialBanner endsAt={Date.now() / 1000 + 86400} plansHref="/empresa/configuracoes" />);
  expect(screen.getByRole("status")).toHaveTextContent("Resta 1 dia");
  expect(screen.getByRole("link")).toHaveAttribute("href", "/empresa/configuracoes");
});
it("oculta a faixa para planos pagos e prazos encerrados", () => {
  const { rerender } = render(<TrialBanner plansHref="/empresa/configuracoes" />);
  expect(screen.queryByRole("status")).toBeNull();
  rerender(<TrialBanner endsAt={Date.now() / 1000 - 1} plansHref="/empresa/configuracoes" />);
  expect(screen.queryByRole("status")).toBeNull();
});
