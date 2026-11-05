import { HTTPException } from "hono/http-exception";
import type { Challenge } from "../../state";
import { getGameProps, getPuzzle } from "../puzzles";

const store = vi.hoisted(() => new Map<string, unknown>());
const put = vi.hoisted(() =>
  vi.fn<(key: string, value: unknown, options?: { ttl?: number }) => void>()
);

vi.mock(`void/env`, () => ({ env: { PUZZLE_SECRET: `secret` } }));
vi.mock(`void/kv`, () => ({
  kv: {
    map: () => ({
      get: async (key: string) => store.get(key) ?? null,
      put: async (key: string, value: unknown, options?: { ttl?: number }) => {
        put(key, value, options);
        store.set(key, value);
      }
    })
  }
}));

const today = `03-02-2026_5x5`;

describe(`puzzles`, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`2026-03-02T12:00:00Z`));
    vi.spyOn(console, `error`).mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    put.mockReset();
    store.clear();
  });

  describe(`getPuzzle`, () => {
    it(`creates the current puzzle the first time it's requested`, async () => {
      // There is no scheduled job to rely on, so a puzzle must always be available on demand
      const [target, challenge, solution] = (await getPuzzle(today))!;

      expect(target).toBeGreaterThan(0);
      expect(challenge).toHaveLength(25);
      expect(solution).toHaveLength(25);
      expect(challenge.toLowerCase()).not.toBe(solution);
      expect(store.get(today)).toStrictEqual([target, challenge, solution]);
    });

    it(`keeps a puzzle around for longer than the day it's playable for`, async () => {
      // A game left open overnight still needs its puzzle in order to be finished
      await getPuzzle(today);

      const [, , options] = put.mock.calls[0];

      expect(options?.ttl).toBeGreaterThan(60 * 60 * 24);
    });

    it(`derives the same puzzle no matter which request creates it`, async () => {
      // Simultaneous first requests each create the puzzle, and must not disagree on what it is
      const first = await getPuzzle(today);
      store.clear();
      const second = await getPuzzle(today);

      expect(second).toStrictEqual(first);
    });

    it(`creates different puzzles for different days and sizes`, async () => {
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
      const stored: Challenge = [42, `abcdefghijklmnopqrstuvwxy`, `solution`];
      store.set(today, stored);

      await expect(getPuzzle(today)).resolves.toStrictEqual(stored);
      expect(put).not.toHaveBeenCalled();
    });

    it(`still serves yesterday's puzzle while it's stored`, async () => {
      const stored: Challenge = [42, `abcdefghijklmnopqrstuvwxy`, `solution`];
      store.set(`03-01-2026_5x5`, stored);

      await expect(getPuzzle(`03-01-2026_5x5`)).resolves.toStrictEqual(stored);
    });

    it(`refuses to create any puzzle other than the current one`, async () => {
      // Creating upcoming puzzles on request would let them be solved ahead of time
      await expect(getPuzzle(`03-03-2026_5x5`)).resolves.toBeNull();
      await expect(getPuzzle(`03-01-2026_5x5`)).resolves.toBeNull();
      await expect(getPuzzle(`03-02-2026_9x9`)).resolves.toBeNull();
      await expect(getPuzzle(`not-a-puzzle`)).resolves.toBeNull();
      expect(put).not.toHaveBeenCalled();
    });

    it(`still serves the puzzle when it can't be stored`, async () => {
      // A storage failure shouldn't take the game down, as the same puzzle can be derived again
      put.mockImplementation(() => {
        throw new Error(`KV is unavailable`);
      });

      await expect(getPuzzle(today)).resolves.toHaveLength(3);
    });
  });

  describe(`getGameProps`, () => {
    it(`loads the current puzzle without revealing its solution`, async () => {
      const props = await getGameProps(`6x7`);
      const [, , solution] = store.get(`03-02-2026_6x7`) as Challenge;

      expect(props.puzzleID).toBe(`03-02-2026_6x7`);
      expect(props.init[0]).toBe(6);
      expect(props.init[1]).toHaveLength(42);
      expect(JSON.stringify(props)).not.toContain(solution);
    });

    it(`defaults to a 5x5 puzzle`, async () => {
      await expect(getGameProps()).resolves.toMatchObject({
        puzzleID: `03-02-2026_5x5`
      });
    });

    it(`responds with a 404 for sizes that don't exist`, async () => {
      const error = await getGameProps(`9x9`).catch((err: unknown) => err);

      expect(error).toBeInstanceOf(HTTPException);
      expect((error as HTTPException).status).toBe(404);
    });
  });
});
