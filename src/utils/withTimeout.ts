/**
 * How long a request gets before it's given up on, in milliseconds.
 *
 * A request without a limit can leave a player watching something that never
 * finishes, with no way to try again, as a browser can wait a very long time
 * on a connection that has quietly died.
 */
export const REQUEST_TIMEOUT = 10_000;

/**
 * Gives up on work that's waiting on someone else's server, for those calls
 * that can't be given a limit of their own.
 */
export const withTimeout = async <T>(work: Promise<T>): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      work,
      new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`No answer came in time`));
        }, REQUEST_TIMEOUT);
      })
    ]);
  } finally {
    clearTimeout(timer);
  }
};
