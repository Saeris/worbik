import { REQUEST_TIMEOUT, withTimeout } from "../withTimeout";

describe(`withTimeout`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(`gives up on an answer that never comes`, async () => {
    // A player's server can go quiet, and this is all that stands between them and waiting forever
    const wait = async (): Promise<unknown> => {
      try {
        return await withTimeout(new Promise<string>(() => {}));
      } catch (cause) {
        return cause;
      }
    };
    const outcome = wait();

    await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT);

    await expect(outcome).resolves.toStrictEqual(
      new Error(`No answer came in time`)
    );
  });

  it(`passes on an answer that comes in time`, async () => {
    await expect(withTimeout(Promise.resolve(`a-token`))).resolves.toBe(
      `a-token`
    );
  });

  it(`passes on a failure as it is`, async () => {
    // What the failure was decides what the player is told
    const cause = new Error(`Signed out`);

    await expect(withTimeout(Promise.reject(cause))).rejects.toBe(cause);
  });

  it(`leaves no timer behind`, async () => {
    // This runs on every request, and a page can stay open all day
    await withTimeout(Promise.resolve());

    expect(vi.getTimerCount()).toBe(0);
  });
});
