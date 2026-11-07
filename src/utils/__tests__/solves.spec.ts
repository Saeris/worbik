// @vitest-environment happy-dom
import { getPuzzleID } from "../getPuzzleID";
import { markPosted, recordSolve } from "../solves";

/** Today's puzzle, as a solve of an old one is soon forgotten */
const puzzle = getPuzzleID();

describe(`a player's solves`, () => {
  afterEach(() => {
    localStorage.clear();
  });

  it(`remembers when a puzzle was first solved`, () => {
    expect(recordSolve(puzzle, 1000)).toStrictEqual({ at: 1000 });
  });

  it(`keeps the first time, however often the puzzle is found solved`, () => {
    // Reopening a solved puzzle a day later must not make it look as if it were solved that day
    recordSolve(puzzle, 1000);

    expect(recordSolve(puzzle, 9000)).toStrictEqual({ at: 1000 });
  });

  it(`remembers that a solve was posted`, () => {
    // Otherwise a score would be sent again each time the puzzle is opened
    recordSolve(puzzle, 1000);
    markPosted(puzzle);

    expect(recordSolve(puzzle, 9000)).toStrictEqual({ at: 1000, posted: true });
  });

  it(`keeps each puzzle's solve apart`, () => {
    const other = getPuzzleID({ width: 7, height: 6 });
    recordSolve(puzzle, 1000);
    markPosted(puzzle);

    expect(recordSolve(other, 2000)).toStrictEqual({ at: 2000 });
  });

  it(`forgets puzzles that are days old`, () => {
    // Saved games are cleared out the same way, so that storage doesn't grow with every day played
    recordSolve(`03-02-2023_5x5`, 1000);
    recordSolve(puzzle, 2000);

    expect(localStorage.getItem(`worbik:solves`)).not.toContain(`03-02-2023`);
    expect(localStorage.getItem(`worbik:solves`)).toContain(puzzle);
  });

  it(`starts over when what is stored isn't a record of solves`, () => {
    // Storage can be edited by hand or left behind by an older version, and must never break the game
    localStorage.setItem(`worbik:solves`, `not even JSON`);

    expect(recordSolve(puzzle, 1000)).toStrictEqual({ at: 1000 });
  });
});
