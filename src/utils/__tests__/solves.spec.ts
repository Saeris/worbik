// @vitest-environment happy-dom
import { getPuzzleID } from "../getPuzzleID";
import {
  adoptGames,
  forgetGames,
  getGameKey,
  getPuzzleOfKey,
  markPosted,
  recordSolve
} from "../solves";

/** Today's puzzle, as a solve of an old one is soon forgotten */
const puzzle = getPuzzleID();

describe(`a player's solves`, () => {
  afterEach(() => {
    localStorage.clear();
  });

  it(`remembers when a puzzle was first solved`, () => {
    expect(recordSolve(puzzle, undefined, 1000)).toStrictEqual({ at: 1000 });
  });

  it(`keeps the first time, however often the puzzle is found solved`, () => {
    // Reopening a solved puzzle a day later must not make it look as if it were solved that day
    recordSolve(puzzle, undefined, 1000);

    expect(recordSolve(puzzle, undefined, 9000)).toStrictEqual({ at: 1000 });
  });

  it(`remembers that a solve was posted`, () => {
    // Otherwise a score would be sent again each time the puzzle is opened
    recordSolve(puzzle, undefined, 1000);
    markPosted(puzzle);

    expect(recordSolve(puzzle, undefined, 9000)).toStrictEqual({
      at: 1000,
      posted: true
    });
  });

  it(`keeps each puzzle's solve apart`, () => {
    const other = getPuzzleID({ width: 7, height: 6 });
    recordSolve(puzzle, undefined, 1000);
    markPosted(puzzle);

    expect(recordSolve(other, undefined, 2000)).toStrictEqual({ at: 2000 });
  });

  it(`forgets puzzles that are days old`, () => {
    // Saved games are cleared out the same way, so that storage doesn't grow with every day played
    recordSolve(`03-02-2023_5x5`, undefined, 1000);
    recordSolve(puzzle, undefined, 2000);

    expect(localStorage.getItem(`worbik:solves`)).not.toContain(`03-02-2023`);
    expect(localStorage.getItem(`worbik:solves`)).toContain(puzzle);
  });

  it(`starts over when what is stored isn't a record of solves`, () => {
    // Storage can be edited by hand or left behind by an older version, and must never break the game
    localStorage.setItem(`worbik:solves`, `not even JSON`);

    expect(recordSolve(puzzle, undefined, 1000)).toStrictEqual({ at: 1000 });
  });
});

describe(`players sharing a device`, () => {
  const alice = `did:plc:alice`;
  const bob = `did:plc:bob`;

  afterEach(() => {
    localStorage.clear();
  });

  it(`keeps each player's games apart`, () => {
    // Two people can use the same device, and someone signed out is one of them
    expect(getGameKey(puzzle)).toBe(puzzle);
    expect(getGameKey(puzzle, alice)).toBe(`${alice}/${puzzle}`);
  });

  it(`can tell which puzzle a saved game is of`, () => {
    // Old games are cleared out by the date in their puzzle's ID, whoever they belong to
    expect(getPuzzleOfKey(getGameKey(puzzle, alice))).toBe(puzzle);
    expect(getPuzzleOfKey(puzzle)).toBe(puzzle);
  });

  it(`doesn't take one player's posted score for another's`, () => {
    // Otherwise a second player on a device could never post a puzzle that the first had
    recordSolve(puzzle, alice, 1000);
    markPosted(puzzle, alice);

    expect(recordSolve(puzzle, bob, 2000)).toStrictEqual({ at: 2000 });
    expect(recordSolve(puzzle, undefined, 3000)).toStrictEqual({ at: 3000 });
  });

  it(`hands a game over to the player who signs in`, () => {
    // This is how a score gets posted: the puzzle is solved first, and signing in comes after
    localStorage.setItem(puzzle, `a game`);
    recordSolve(puzzle, undefined, 1000);

    adoptGames(alice);

    expect(localStorage.getItem(getGameKey(puzzle, alice))).toBe(`a game`);
    expect(recordSolve(puzzle, alice, 9000)).toStrictEqual({ at: 1000 });
  });

  it(`leaves nothing behind for whoever uses the device next`, () => {
    localStorage.setItem(puzzle, `a game`);
    recordSolve(puzzle, undefined, 1000);

    adoptGames(alice);

    expect(localStorage.getItem(puzzle)).toBeNull();
    expect(recordSolve(puzzle, undefined, 9000)).toStrictEqual({ at: 9000 });
  });

  it(`doesn't replace a game that the player already has`, () => {
    // What they did while signed in counts for more than what someone did while signed out
    localStorage.setItem(getGameKey(puzzle, alice), `their own game`);
    recordSolve(puzzle, alice, 1000);
    localStorage.setItem(puzzle, `a game`);
    recordSolve(puzzle, undefined, 2000);

    adoptGames(alice);

    expect(localStorage.getItem(getGameKey(puzzle, alice))).toBe(
      `their own game`
    );
    expect(recordSolve(puzzle, alice, 9000)).toStrictEqual({ at: 1000 });
    expect(localStorage.getItem(puzzle)).toBe(`a game`);
  });

  it(`hands over everything it can when storage runs out part way`, () => {
    // Stopping at the first game that doesn't fit would leave the rest behind, and the record of when each was solved
    const other = puzzle.replace(`5x5`, `6x6`);

    /** Keeps what it's given as its own properties, as storage does, and has no room for one of them */
    class Crowded {
      [key: string]: unknown;

      getItem(key: string): string | null {
        return typeof this[key] === `string` ? this[key] : null;
      }

      setItem(key: string, value: string): void {
        if (value.includes(`won't fit`)) {
          throw new DOMException(`Full`, `QuotaExceededError`);
        }

        this[key] = value;
      }

      removeItem(key: string): void {
        // oxlint-disable-next-line typescript/no-dynamic-delete -- this is what removing something from storage is
        delete this[key];
      }
    }

    const storage = new Crowded();

    storage[puzzle] = `a game that won't fit`;
    storage[other] = `a game`;
    storage[`worbik:solves`] = JSON.stringify({ [other]: { at: 1000 } });
    vi.stubGlobal(`localStorage`, storage);

    adoptGames(alice);

    expect(storage.getItem(getGameKey(other, alice))).toBe(`a game`);
    expect(recordSolve(other, alice, 9000)).toStrictEqual({ at: 1000 });
    // Still there to be handed over the next time, rather than lost
    expect(storage.getItem(puzzle)).toBe(`a game that won't fit`);
    vi.unstubAllGlobals();
  });

  it(`only hands over saved games`, () => {
    // Everything else in storage belongs to the app
    localStorage.setItem(`theme`, `dark`);

    adoptGames(alice);

    expect(localStorage.getItem(`theme`)).toBe(`dark`);
    expect(localStorage.getItem(getGameKey(`theme`, alice))).toBeNull();
  });

  it(`can forget everything that one player did`, () => {
    localStorage.setItem(getGameKey(puzzle, alice), `a game`);
    localStorage.setItem(getGameKey(puzzle, bob), `another`);
    recordSolve(puzzle, alice, 1000);

    forgetGames(alice);

    expect(localStorage.getItem(getGameKey(puzzle, alice))).toBeNull();
    expect(localStorage.getItem(getGameKey(puzzle, bob))).toBe(`another`);
    expect(recordSolve(puzzle, alice, 9000)).toStrictEqual({ at: 9000 });
  });
});
