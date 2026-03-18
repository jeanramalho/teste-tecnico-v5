// apps/mobile/src/hooks/useOfflineQueue.ts

import { useState, useCallback, useRef, useEffect } from "react";

export interface QueuedOperation {
  id: string;
  type: "UPDATE_STATUS" | "ADD_NOTE" | "ADD_PHOTO";
  entityId: string;
  payload: unknown;
  createdAt: number;
  retryCount: number;
  status: "PENDING" | "PROCESSING" | "FAILED" | "DONE";
}

export interface ProcessResult {
  processed: number;
  failed: number;
  skipped: number;
}

interface UseOfflineQueueOptions {
  executor: (op: QueuedOperation) => Promise<void>;
  maxRetries?: number;
}

export function useOfflineQueue({ executor, maxRetries = 5 }: UseOfflineQueueOptions) {
  const [queue, setQueue] = useState<QueuedOperation[]>([]);
  const [processing, setProcessing] = useState(false);
  
  const processingRef = useRef(false);
  const queueRef = useRef<QueuedOperation[]>([]);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const enqueue = useCallback(
    (op: Omit<QueuedOperation, "id" | "createdAt" | "retryCount" | "status">) => {
      setQueue((prev) => {
        const exists = prev.some(
          (x) => x.entityId === op.entityId && x.type === op.type && x.status === "PENDING"
        );
        if (exists) return prev; // idempotência

        const newOp: QueuedOperation = {
          ...op,
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          createdAt: Date.now(),
          retryCount: 0,
          status: "PENDING",
        };
        return [...prev, newOp];
      });
    },
    []
  );

  const processQueue = useCallback(async (): Promise<ProcessResult> => {
    if (processingRef.current) {
      return { processed: 0, failed: 0, skipped: 0 };
    }

    processingRef.current = true;
    setProcessing(true);

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    const updateItem = (id: string, updates: Partial<QueuedOperation>) => {
      setQueue((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
      queueRef.current = queueRef.current.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );
    };

    try {
      const pendingItems = queueRef.current
        .filter((x) => x.status === "PENDING")
        .sort((a, b) => a.createdAt - b.createdAt);

      for (const item of pendingItems) {
        updateItem(item.id, { status: "PROCESSING" });

        try {
          await executor(item);
          updateItem(item.id, { status: "DONE" });
          processed++;
        } catch (error) {
          const nextRetry = item.retryCount + 1;
          failed++;
          
          if (nextRetry >= maxRetries) {
            updateItem(item.id, { status: "FAILED", retryCount: nextRetry });
            // Deixa seguir para o próximo erro permanente não deve travar toda a fila (embora dependa da regra de negócios da empresa)
          } else {
            updateItem(item.id, { status: "PENDING", retryCount: nextRetry });
            
            // Backoff exponencial lock queue temporario
            const delay = 1000 * Math.pow(2, item.retryCount); // 1s, 2s, 4s, 8s
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            timeoutRef.current = setTimeout(() => {
              processQueue();
            }, delay);
            break; // Quebra o FIFO atual para aguardar o delay antes de tentar processar ele mesmo
          }
        }
      }
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }

    return { processed, failed, skipped };
  }, [executor, maxRetries]);

  const pending = queue.filter(
    (x) => x.status === "PENDING" || x.status === "PROCESSING"
  );

  return {
    enqueue,
    processQueue,
    pending,
    processing,
  };
}
