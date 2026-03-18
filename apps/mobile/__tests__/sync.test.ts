// apps/mobile/__tests__/sync.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, act } from "@testing-library/react-native";
import { useOfflineQueue } from "../src/hooks/useOfflineQueue";

// Um wrapper para extrair o resultado do hook sem depender do `renderHook`
let hookResult: ReturnType<typeof useOfflineQueue>;
function HookWrapper({ executor, maxRetries }: any) {
  hookResult = useOfflineQueue({ executor, maxRetries });
  return null;
}

function setupHook(executor: any, maxRetries?: number) {
  render(React.createElement(HookWrapper, { executor, maxRetries }));
  return {
    get current() {
      return hookResult;
    }
  };
}

describe("useOfflineQueue", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("Enfileira e processa operação com sucesso", async () => {
    const executor = vi.fn().mockResolvedValue(undefined);
    const result = setupHook(executor);

    act(() => {
      result.current.enqueue({ type: "UPDATE_STATUS", entityId: "1", payload: "VENDIDO" });
    });

    expect(result.current.pending).toHaveLength(1);

    await act(async () => {
      await result.current.processQueue();
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(result.current.pending).toHaveLength(0); // ficou DONE
  });

  it("Retry com backoff após falha do executor", async () => {
    const executor = vi.fn().mockRejectedValue(new Error("Network Error"));
    const result = setupHook(executor);

    act(() => {
      result.current.enqueue({ type: "ADD_NOTE", entityId: "1", payload: "Note 1" });
    });

    await act(async () => {
      await result.current.processQueue();
    });

    expect(executor).toHaveBeenCalledTimes(1);
    expect(result.current.pending[0].retryCount).toBe(1);

    // O fallback de 1s (1000 * 2^0) = 1000ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });

    expect(executor).toHaveBeenCalledTimes(2);
    expect(result.current.pending[0].retryCount).toBe(2);
  });

  it("Não duplica operação com mesma entityId + type (idempotência)", () => {
    const result = setupHook(vi.fn());

    act(() => {
      result.current.enqueue({ type: "ADD_NOTE", entityId: "1", payload: "Note" });
      result.current.enqueue({ type: "ADD_NOTE", entityId: "1", payload: "Note 2" });
    });

    expect(result.current.pending).toHaveLength(1);
  });

  it("Marca como FAILED após maxRetries tentativas", async () => {
    const executor = vi.fn().mockRejectedValue(new Error("Fail"));
    const result = setupHook(executor, 2); // usa 2 pra não ter que simular os 5 longos

    act(() => {
      result.current.enqueue({ type: "ADD_NOTE", entityId: "1", payload: "Failll" });
    });

    // Primeira tentativa
    await act(async () => { await result.current.processQueue(); });
    // RetryCount = 1, backoff de 1s
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    // RetryCount = 2, Failed
    
    expect(executor).toHaveBeenCalledTimes(2);
    expect(result.current.pending).toHaveLength(0); // Saiu dos pending porque FAILED
  });
});
