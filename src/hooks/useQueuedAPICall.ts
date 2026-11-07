import { useCallback, useRef } from "react";

/**
 * Passes items to an async function as soon as they are queued.
 *
 * Calls never overlap: items that are queued while a call is still in flight
 * are held back, and then passed along together once it settles. Should a
 * call fail, its items are kept and sent again with the next one queued.
 */
export const useQueuedAPICall = <T>(
  fn: (queue: T[]) => Promise<void>
): ((item: T) => void) => {
  const queue = useRef<T[]>([]);
  const busy = useRef(false);

  return useCallback(
    (item: T) => {
      queue.current.push(item);

      if (busy.current) return;

      busy.current = true;

      void (async (): Promise<void> => {
        while (queue.current.length) {
          const batch = queue.current.splice(0);

          try {
            // Each call has to settle before the next starts, so that their results are applied in order
            // oxlint-disable-next-line no-await-in-loop
            await fn(batch);
          } catch (err: unknown) {
            queue.current.unshift(...batch);
            console.error(`Failed to process queued items`, err);
            break;
          }
        }

        busy.current = false;
      })();
    },
    [fn]
  );
};
