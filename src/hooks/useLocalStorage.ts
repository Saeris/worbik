// Adapted from https://medium.com/@lean1190/uselocalstorage-hook-for-next-js-typed-and-ssr-friendly-4ddd178676df
// Originally used the `usehooks-ts` version of this, but it appears
// to be incompatible with the app router architecture
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState(initialValue);
  const [firstLoadDone, setFirstLoadDone] = useState(false);

  useEffect(() => {
    const fromLocal = (): T => {
      if (typeof window === `undefined`) {
        return initialValue;
      }
      try {
        const item = window.localStorage.getItem(key);
        return item ? (JSON.parse(item) as T) : initialValue;
      } catch (error: unknown) {
        return initialValue;
      }
    };

    setStoredValue(fromLocal);
    setFirstLoadDone(true);
  }, [initialValue, key]);

  useEffect(() => {
    if (!firstLoadDone) {
      return;
    }

    if (typeof window !== `undefined`) {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    }
  }, [storedValue, firstLoadDone, key]);

  return [storedValue, setStoredValue];
};
