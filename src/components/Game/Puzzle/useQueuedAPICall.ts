import { useEffect, useState } from "react";

export const useQueuedAPICall = <T>(
  fn: (queue: T[]) => Promise<void>,
  delay = 500
): ((item: T) => void) => {
  const [queue, setQueue] = useState(new Array<T>());

  useEffect(() => {
    if (queue.length) {
      const timer = setTimeout(() => {
        void fn(queue);
        // flush queue
        queue.length = 0;
      }, delay);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [fn, queue, delay]);

  return (item: T) => {
    setQueue((prev) => [...prev, item]);
  };
};
