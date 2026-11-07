import { db } from "void/db";
import { scores } from "../../db/schema";
import { getPuzzleID } from "../../utils/getPuzzleID";
import { getProfile } from "../profile";
import { getPuzzle } from "../puzzles";
import {
  deleteScores,
  getDayScores,
  getLeaderboard,
  getPostedGames,
  getRanking,
  getScore,
  recordScore,
  submitGame
} from "../scores";
import type { createTestDb } from "./harness";

vi.mock(`void/db`, async (importOriginal) => {
  const { createTestDb: create } = await import(`./harness`);

  return { ...(await importOriginal<object>()), db: create() };
});

vi.mock(`../puzzles`, () => ({ getPuzzle: vi.fn<typeof getPuzzle>() }));

const puzzle = getPuzzleID();
const [today] = puzzle.split(`_`);
const other = getPuzzleID({ width: 6, height: 6 });
const alice = { did: `did:plc:alice`, handle: `alice.test` };
const bob = { did: `did:plc:bob`, handle: `bob.test` };

/** A board that takes two moves to solve: both of its rows are rotated once */
const solution = `abcdefghijklmnopqrstuvwxy`;
const start = `eabcdjfghiklmnopqrstuvwxy`;
const middle = `abcdejfghiklmnopqrstuvwxy`;

/** Puts a score on a leaderboard directly, at a moment of the test's choosing */
const seed = async (
  moves: number,
  did: string,
  at: number = 1000,
  game: string = puzzle,
  handle: string | null = null
): Promise<void> => {
  await db
    .insert(scores)
    .values({ puzzle: game, did, handle, moves, createdAt: new Date(at) });
};

describe(`scores`, () => {
  beforeEach(() => {
    vi.mocked(getPuzzle).mockResolvedValue([2, start, solution]);
  });

  afterEach(() => {
    (db as unknown as ReturnType<typeof createTestDb>).clear();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe(`submitGame`, () => {
    it(`scores a game by replaying it`, async () => {
      // A score is only worth anything if it's earned, so the moves are counted here and never taken on trust
      const score = await submitGame(puzzle, [start, middle, solution], alice);

      expect(score.moves).toBe(2);
    });

    it(`turns away a game that doesn't solve the puzzle`, async () => {
      await expect(
        submitGame(puzzle, [start, middle], alice)
      ).rejects.toMatchObject({ status: 422 });
      await expect(getLeaderboard(puzzle)).resolves.toStrictEqual([]);
    });

    it(`turns away a game that skips to the answer`, async () => {
      // This is what cheating would look like: a real start and a real finish, with nothing between them
      await expect(
        submitGame(puzzle, [start, solution], alice)
      ).rejects.toMatchObject({ status: 422 });
    });

    it(`turns away a puzzle that doesn't exist`, async () => {
      vi.mocked(getPuzzle).mockResolvedValue(null);

      await expect(
        submitGame(puzzle, [start, solution], alice)
      ).rejects.toMatchObject({ status: 404 });
    });

    it(`turns away a solve once the puzzle's leaderboard has closed`, async () => {
      // Otherwise anyone could look up yesterday's answer and post a perfect game
      vi.useFakeTimers({ toFake: [`Date`] });
      vi.setSystemTime(Date.now() + 2 * 24 * 60 * 60 * 1000);

      await expect(
        submitGame(puzzle, [start, middle, solution], alice)
      ).rejects.toMatchObject({ status: 403 });
    });
  });

  describe(`recordScore`, () => {
    it(`keeps a player's first score, however much better a later one is`, async () => {
      // A leaderboard that took the best attempt would only measure how many attempts someone was willing to make
      await recordScore(puzzle, { ...alice, moves: 40 });

      const kept = await recordScore(puzzle, { ...alice, moves: 2 });

      expect(kept.moves).toBe(40);
      await expect(getLeaderboard(puzzle)).resolves.toHaveLength(1);
    });

    it(`keeps a score for each puzzle`, async () => {
      await recordScore(puzzle, { ...alice, moves: 40 });
      await recordScore(other, { ...alice, moves: 2 });

      await expect(getScore(other, alice.did)).resolves.toMatchObject({
        moves: 2
      });
    });
  });

  describe(`getLeaderboard`, () => {
    it(`ranks the fewest moves first`, async () => {
      await seed(30, `did:plc:slow`);
      await seed(10, `did:plc:fast`);

      const ranked = await getLeaderboard(puzzle);

      expect(ranked.map(({ did }) => did)).toStrictEqual([
        `did:plc:fast`,
        `did:plc:slow`
      ]);
    });

    it(`ranks whoever got there first among those who tie`, async () => {
      await seed(10, `did:plc:later`, 2000);
      await seed(10, `did:plc:earlier`, 1000);

      const ranked = await getLeaderboard(puzzle);

      expect(ranked[0].did).toBe(`did:plc:earlier`);
    });

    it(`only lists the puzzle that was asked for`, async () => {
      await seed(10, alice.did, 1000, other);

      await expect(getLeaderboard(puzzle)).resolves.toStrictEqual([]);
    });
  });

  describe(`getRanking`, () => {
    it(`says where a player stands, however far down the list that is`, async () => {
      // The top 100 are all that's listed, and a player beyond them still has a place
      await Promise.all(
        Array.from({ length: 120 }, async (_, index) =>
          seed(index + 1, `did:plc:player${index}`)
        )
      );
      await seed(500, alice.did);

      const {
        scores: listed,
        total,
        you
      } = await getRanking(puzzle, alice.did);

      expect(listed).toHaveLength(100);
      expect(total).toBe(121);
      expect(you).toMatchObject({ did: alice.did, place: 121 });
    });

    it(`places a player behind those who tied with them earlier`, async () => {
      await seed(10, `did:plc:first`, 1000);
      await seed(10, `did:plc:second`, 1500);
      await seed(10, alice.did, 2000);
      await seed(10, `did:plc:later`, 3000);

      const { you } = await getRanking(puzzle, alice.did);

      expect(you?.place).toBe(3);
    });

    it(`counts only the scores on the same puzzle`, async () => {
      await seed(1, `did:plc:elsewhere`, 1000, other);
      await seed(10, alice.did);

      const { you, total } = await getRanking(puzzle, alice.did);

      expect(you?.place).toBe(1);
      expect(total).toBe(1);
    });

    it(`has nothing to say about a player with no score`, async () => {
      await seed(10, bob.did);

      const { you } = await getRanking(puzzle, alice.did);

      expect(you).toBeNull();
    });

    it(`doesn't take a score on another puzzle for one on this`, async () => {
      // A player would be told that they had placed on a leaderboard that they aren't on
      await seed(10, alice.did, 1000, other);

      const { you } = await getRanking(puzzle, alice.did);

      expect(you).toBeNull();
    });
  });

  describe(`getScore`, () => {
    it(`finds a score by the player's identity`, async () => {
      await seed(10, alice.did, 1000, puzzle, alice.handle);

      await expect(getScore(puzzle, alice.did)).resolves.toMatchObject({
        moves: 10
      });
    });

    it(`finds a score by handle, however it's written`, async () => {
      // Handles aren't case sensitive, and a shared link can be typed out by hand
      await seed(10, alice.did, 1000, puzzle, alice.handle);

      await expect(getScore(puzzle, `Alice.TEST`)).resolves.toMatchObject({
        moves: 10
      });
    });

    it(`goes with whoever posted under a handle last`, async () => {
      // A handle can pass from one player to another, and a link should show the one who has it now
      await seed(10, `did:plc:former`, 1000, puzzle, alice.handle);
      await seed(20, `did:plc:current`, 2000, puzzle, alice.handle);

      await expect(getScore(puzzle, alice.handle)).resolves.toMatchObject({
        did: `did:plc:current`
      });
    });

    it(`finds nothing for a player who hasn't posted`, async () => {
      await expect(getScore(puzzle, alice.did)).resolves.toBeNull();
    });
  });

  describe(`what a device is told about a day`, () => {
    it(`lists a player's own scores from that day`, async () => {
      await seed(10, alice.did);
      await seed(20, alice.did, 1000, other);
      await seed(30, bob.did);
      await seed(40, alice.did, 1000, `01-01-2020_5x5`);

      const posted = await getDayScores(alice.did, today);

      expect(posted).toHaveLength(2);
      expect(posted).toContainEqual({ puzzle, moves: 10 });
    });

    it(`keeps solutions out of what anyone can ask for`, async () => {
      // Leaderboards name who has solved a puzzle, so a player's name is no proof of anything
      await seed(10, alice.did);

      const posted = await getDayScores(alice.did, today);

      expect(JSON.stringify(posted)).not.toContain(solution);
    });

    it(`gives a player their whole game, to open it as solved`, async () => {
      await seed(10, alice.did);

      await expect(getPostedGames(alice.did, today)).resolves.toStrictEqual([
        { puzzle, moves: 10, challenge: start, solution }
      ]);
    });

    it(`leaves out a game whose puzzle has gone`, async () => {
      vi.mocked(getPuzzle).mockResolvedValue(null);
      await seed(10, alice.did);

      await expect(getPostedGames(alice.did, today)).resolves.toStrictEqual([]);
    });
  });

  describe(`deleteScores`, () => {
    it(`removes everything of a player's, and nobody else's`, async () => {
      // There's no undoing this, so it can't reach an inch further than it was asked to
      await seed(10, alice.did);
      await seed(20, alice.did, 1000, other);
      await seed(30, bob.did);

      await deleteScores(alice.did);

      await expect(getProfile(alice.did)).resolves.toStrictEqual({
        handle: null,
        days: [],
        recent: []
      });
      await expect(getScore(puzzle, bob.did)).resolves.toMatchObject({
        moves: 30
      });
    });

    it(`moves those behind them up the leaderboard`, async () => {
      await seed(10, alice.did);
      await seed(20, bob.did);

      await deleteScores(alice.did);

      const { you } = await getRanking(puzzle, bob.did);

      expect(you?.place).toBe(1);
    });
  });

  describe(`getProfile`, () => {
    it(`counts how many puzzles were solved on each day`, async () => {
      // Streaks are worked out from this, so a day has to come out as a day whatever the size of the board
      await seed(10, alice.did, 1000, `11-05-2026_5x5`);
      await seed(10, alice.did, 2000, `11-05-2026_8x6`);
      await seed(10, alice.did, 3000, `11-06-2026_5x5`);

      const { days } = await getProfile(alice.did);

      expect(days).toStrictEqual([
        { day: `11-05-2026`, solved: 2 },
        { day: `11-06-2026`, solved: 1 }
      ]);
    });

    it(`lists the latest five results, newest first`, async () => {
      await Promise.all(
        [1, 2, 3, 4, 5, 6].map(async (day) =>
          seed(10, alice.did, day * 1000, `11-0${day}-2026_5x5`)
        )
      );

      const { recent } = await getProfile(alice.did);

      expect(recent.map((result) => result.puzzle)).toStrictEqual([
        `11-06-2026_5x5`,
        `11-05-2026_5x5`,
        `11-04-2026_5x5`,
        `11-03-2026_5x5`,
        `11-02-2026_5x5`
      ]);
    });

    it(`says where each result placed`, async () => {
      await seed(5, bob.did);
      await seed(10, alice.did);

      const { recent } = await getProfile(alice.did);

      expect(recent[0].place).toBe(2);
    });

    it(`goes by the handle of the latest score`, async () => {
      await seed(10, alice.did, 1000, puzzle, `old.test`);
      await seed(10, alice.did, 2000, other, `new.test`);

      const { handle } = await getProfile(alice.did);

      expect(handle).toBe(`new.test`);
    });
  });
});
