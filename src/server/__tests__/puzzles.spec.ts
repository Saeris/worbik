import type { Challenge } from "../../state";
import type * as Puzzles from "../puzzles";

const store = vi.hoisted(() => new Map<string, unknown>());
const get = vi.hoisted(() =>
  vi.fn<(key: string) => unknown>((key) => store.get(key) ?? null)
);
const put = vi.hoisted(() =>
  vi.fn<(key: string, value: unknown, options?: { ttl?: number }) => void>()
);

const env = vi.hoisted(() => ({
  PUZZLE_SECRET: `secret`,
  PUZZLE_SCRAMBLE: undefined as number | undefined
}));

vi.mock(`void/env`, () => ({ env }));
vi.mock(`void/kv`, () => ({
  kv: {
    map: () => ({
      get: async (key: string) => get(key),
      put: async (key: string, value: unknown, options?: { ttl?: number }) => {
        put(key, value, options);
        store.set(key, value);
      }
    })
  }
}));

/**
 * Starts a Worker that has yet to look up any puzzle.
 *
 * A Worker remembers the puzzles it has looked up, so every test starts
 * one of its own rather than inheriting what the test before it learned.
 */
const start = async (): Promise<typeof Puzzles> => {
  vi.resetModules();
  return import(`../puzzles`);
};

const today = `03-02-2026_5x5`;
const stored: Challenge = [42, `abcdefghijklmnopqrstuvwxy`, `solution`];

describe(`puzzles`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`2026-03-02T12:00:00Z`));
    vi.spyOn(console, `error`).mockImplementation(() => {});
  });

  it(`only takes a set scramble from development`, async () => {
    // A puzzle is kept for good, so a setting left on by mistake would leave a day of puzzles solvable in one move
    env.PUZZLE_SCRAMBLE = 1;

    try {
      const made = async (): Promise<number | undefined> => {
        store.clear();
        const { getPuzzle } = await start();

        return (await getPuzzle(today))?.[0];
      };

      await expect(made()).resolves.toBe(1);

      vi.stubEnv(`DEV`, false);

      await expect(made()).resolves.toBeGreaterThan(1);
    } finally {
      env.PUZZLE_SCRAMBLE = undefined;
      vi.unstubAllEnvs();
    }
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    get.mockReset();
    put.mockReset();
    store.clear();
  });

  describe(`getPuzzle`, () => {
    it(`creates the current puzzle the first time it's requested`, async () => {
      // There is no scheduled job to rely on, so a puzzle must always be available on demand
      const { getPuzzle } = await start();
      const [target, challenge, solution] = (await getPuzzle(today))!;

      expect(target).toBeGreaterThan(0);
      expect(challenge).toHaveLength(25);
      expect(solution).toHaveLength(25);
      expect(challenge.toLowerCase()).not.toBe(solution);
      expect(store.get(today)).toStrictEqual([target, challenge, solution]);
    });

    it(`keeps a puzzle for good`, async () => {
      // A puzzle that expired could never be played again, and the scores on it would rank a game nobody can see
      const { getPuzzle } = await start();
      await getPuzzle(today);

      const [, , options] = put.mock.calls[0];

      expect(options).toBeUndefined();
    });

    it(`derives the same puzzle no matter which request creates it`, async () => {
      // Simultaneous first requests each create the puzzle, and must not disagree on what it is
      const first = await (await start()).getPuzzle(today);
      store.clear();
      const second = await (await start()).getPuzzle(today);

      expect(second).toStrictEqual(first);
    });

    it(`creates different puzzles for different days and sizes`, async () => {
      const { getPuzzle } = await start();
      const puzzle = await getPuzzle(today);
      const otherSize = await getPuzzle(`03-02-2026_5x6`);

      vi.setSystemTime(new Date(`2026-03-03T12:00:00Z`));
      const tomorrow = await getPuzzle(`03-03-2026_5x5`);

      expect(otherSize?.[2]).toHaveLength(30);
      expect(otherSize?.[2].slice(0, 25)).not.toBe(puzzle?.[2]);
      expect(tomorrow?.[2]).not.toBe(puzzle?.[2]);
    });

    it(`serves a stored puzzle as is, rather than creating it again`, async () => {
      // A puzzle must not change part way through its day, e.g. when the word list is updated
      const { getPuzzle } = await start();
      store.set(today, stored);

      await expect(getPuzzle(today)).resolves.toStrictEqual(stored);
      expect(put).not.toHaveBeenCalled();
    });

    it(`still serves a puzzle from long ago`, async () => {
      // Past puzzles stay playable for as long as they are stored, which is for good
      const { getPuzzle } = await start();
      store.set(`01-15-2025_5x5`, stored);

      await expect(getPuzzle(`01-15-2025_5x5`)).resolves.toStrictEqual(stored);
    });

    it(`refuses to create any puzzle other than the current one`, async () => {
      // Creating upcoming puzzles on request would let them be solved ahead of time
      const { getPuzzle } = await start();

      await expect(getPuzzle(`03-03-2026_5x5`)).resolves.toBeNull();
      await expect(getPuzzle(`03-01-2026_5x5`)).resolves.toBeNull();
      await expect(getPuzzle(`03-02-2026_9x9`)).resolves.toBeNull();
      await expect(getPuzzle(`not-a-puzzle`)).resolves.toBeNull();
      expect(put).not.toHaveBeenCalled();
    });

    it(`still serves the puzzle when it can't be stored`, async () => {
      // A storage failure shouldn't take the game down, as the same puzzle can be derived again
      const { getPuzzle } = await start();
      put.mockImplementation(() => {
        throw new Error(`KV is unavailable`);
      });

      await expect(getPuzzle(today)).resolves.toHaveLength(3);
    });

    it(`answers from memory while requests for a puzzle keep arriving`, async () => {
      // Every move a player makes is checked against a puzzle, so a read of the store for each would be most of what the game costs to run
      const { getPuzzle } = await start();
      store.set(today, stored);

      await getPuzzle(today);
      await getPuzzle(today);

      await expect(getPuzzle(today)).resolves.toStrictEqual(stored);
      expect(get).toHaveBeenCalledTimes(1);
    });

    it(`stores a puzzle once, however long the store takes to show it`, async () => {
      // KV can go on reporting a puzzle as missing for a while after it's written, and only so many writes are allowed in a day
      const { getPuzzle } = await start();
      get.mockReturnValue(null);

      const first = await getPuzzle(today);
      await getPuzzle(today);

      await expect(getPuzzle(today)).resolves.toStrictEqual(first);
      expect(put).toHaveBeenCalledTimes(1);
    });

    it(`comes to serve the stored puzzle when another Worker's was kept over its own`, async () => {
      // Two Workers that create a puzzle at once can disagree on it right after a deployment, and players must not be checked against two different answers for long
      const { getPuzzle } = await start();
      await getPuzzle(today);
      store.set(today, stored);

      vi.advanceTimersByTime(60 * 1000);

      await expect(getPuzzle(today)).resolves.toStrictEqual(stored);
    });
  });

  describe(`getGameProps`, () => {
    it(`loads the current puzzle without revealing its solution`, async () => {
      const { getGameProps } = await start();
      const props = await getGameProps(`6x7`);
      const [, , solution] = store.get(`03-02-2026_6x7`) as Challenge;

      expect(props.puzzleID).toBe(`03-02-2026_6x7`);
      expect(props.init[0]).toBe(6);
      expect(props.init[1]).toHaveLength(42);
      expect(JSON.stringify(props)).not.toContain(solution);
    });

    it(`defaults to a 5x5 puzzle`, async () => {
      const { getGameProps } = await start();

      await expect(getGameProps()).resolves.toMatchObject({
        puzzleID: `03-02-2026_5x5`
      });
    });

    it(`responds with a 404 for sizes that don't exist`, async () => {
      const { getGameProps } = await start();

      await expect(getGameProps(`9x9`)).rejects.toMatchObject({ status: 404 });
    });
  });
});
