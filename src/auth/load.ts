import { OutdatedError } from "./errors";
import type * as OAuth from "./oauth";

/**
 * Fetches the code for signing in, which only those who sign in need.
 *
 * A deployment removes the files of the one before it, so this can fail on a
 * page that was opened before one. What a browser fails to import, it may
 * also go on failing to import until the page is loaded again.
 */
export const loadOAuth = async (): Promise<typeof OAuth> => {
  try {
    return await import(`./oauth`);
  } catch (cause) {
    throw new OutdatedError(`This page is out of date`, { cause });
  }
};

/** Whether loading the page again is what it would take to get past a failure. It never would be for a device with no connection, which would only lose the page. */
export const isOutdated = (cause: unknown): boolean =>
  cause instanceof OutdatedError && navigator.onLine;

/** Loads the page again if that's what it would take to get past a failure, and returns whether it's doing so */
export const reloadIfOutdated = (cause: unknown): boolean => {
  const outdated = isOutdated(cause);

  if (outdated) location.reload();

  return outdated;
};
