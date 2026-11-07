import type { Size } from "../../utils/sizes";
import { PuzzleState } from "../PuzzleState";
import { MAX_MOVES, replay } from "../replay";

/**
 * A 3×2 puzzle whose solution is `abc` over `def`. From where it starts,
 * rotating the first row right and the second row right solves it.
 *
 * That is smaller than any real puzzle, which keeps every state in these
 * tests short enough to be read at a glance.
 */
const width = 3 as Size;
const challenge = `bcaefd`;
const solution = `abcdef`;
const solved = [`bcaefd`, `abcefd`, `abcdef`];

describe(`replay`, () => {
  it(`counts the moves of a game that solves the puzzle`, () => {
    expect(replay(width, challenge, solution, solved)).toBe(2);
  });

  it(`accepts the history that the game itself keeps`, () => {
    // What a player submits is what their own game recorded, so the two have to agree on what a game is
    const game = new PuzzleState([width, challenge]);
    game.getNextState(1, `right`).getNextState(0, `right`);

    expect(replay(width, challenge, solution, game.history)).toBe(2);
  });

  it(`follows moves along both rows and columns`, () => {
    const history = [
      `bcaefd`,
      `ecabfd`, // first column down
      `bcaefd`, // first column up
      `cabefd`, // first row left
      `bcaefd`, // first row right
      `abcefd`,
      `abcdef`
    ];

    expect(replay(width, challenge, solution, history)).toBe(6);
  });

  it(`counts a move that leaves the board as it was`, () => {
    // Rotating a row of identical letters changes nothing, but it is still a move that was made
    expect(
      replay(width, `aaabca`, `aaaabc`, [`aaabca`, `aaabca`, `aaaabc`])
    ).toBe(2);
  });

  it(`ignores the case that hints are marked with`, () => {
    // A challenge marks letters that begin in place by uppercasing them
    expect(
      replay(width, `bcaEfd`, solution, [`bcaefd`, `abcefd`, `abcdef`])
    ).toBe(2);
  });

  it(`stops counting once the puzzle has been solved`, () => {
    expect(replay(width, challenge, solution, [...solved, `bcadef`])).toBe(2);
  });

  it(`rejects a game that never solves the puzzle`, () => {
    expect(replay(width, challenge, solution, [`bcaefd`, `abcefd`])).toBeNull();
    expect(replay(width, challenge, solution, [`bcaefd`])).toBeNull();
    expect(replay(width, challenge, solution, [])).toBeNull();
  });

  it(`rejects a game that skips over moves`, () => {
    // The whole point: claiming the solution isn't the same as having played to it
    expect(replay(width, challenge, solution, [`bcaefd`, `abcdef`])).toBeNull();
  });

  it(`rejects a game that begins anywhere but where the puzzle does`, () => {
    expect(replay(width, challenge, solution, [`abcefd`, `abcdef`])).toBeNull();
    expect(replay(width, challenge, solution, [`abcdef`])).toBeNull();
  });

  it(`rejects a game that changes the letters on the board`, () => {
    expect(
      replay(width, challenge, solution, [`bcaefd`, `abcefd`, `abcdeg`])
    ).toBeNull();
    expect(
      replay(width, challenge, solution, [`bcaefd`, `abcef`, `abcdef`])
    ).toBeNull();
  });

  it(`rejects a game with more moves than one could reasonably take`, () => {
    // Bounds how much work a submission can ask of the server
    const stalling = Array.from({ length: MAX_MOVES + 1 }, (_, move) =>
      move % 2 ? `bcaefd` : `cabefd`
    );

    expect(
      replay(width, challenge, solution, [challenge, ...stalling])
    ).toBeNull();
  });
});
