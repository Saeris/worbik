import type { Challenge } from "#state";
import { checkGuesses, readBoard, vouchForBoard } from "../moves";

vi.mock(`void/env`, () => ({ env: { PUZZLE_SECRET: `secret` } }));

const puzzle = `03-02-2026_5x5`;
const other = `03-03-2026_5x5`;
const solution = `abcdefghijklmnopqrstuvwxy`;
/** The solution with its first row rotated one place to the right */
const challenge = `eabcdfghijklmnopqrstuvwxy`;
const game: Challenge = [1, challenge, solution];

/** The board that a move leads to from the one above, and from which another move solves it */
const oneMove = `abcdefghijklmnopqrstuvwxy`;
/** The board two moves from the start: the first row rotated, then the second */
const twoMoves = `abcdejfghiklmnopqrstuvwxy`;

describe(`checkGuesses`, () => {
  it(`says which letters of a real move are in place`, async () => {
    const { hints } = await checkGuesses(puzzle, game, [oneMove]);

    expect(hints).toStrictEqual([solution.toUpperCase()]);
  });

  it(`refuses a board of letters that the puzzle doesn't have`, async () => {
    // This is the cheat: twenty-six guesses like these used to read out a whole solution
    await expect(
      checkGuesses(puzzle, game, [`a`.repeat(25)])
    ).rejects.toMatchObject({ status: 409 });
  });

  it(`refuses a rearrangement of the puzzle's letters`, async () => {
    // Sliding every letter along by one puts each letter on each square in as many guesses as there are squares, which is just as quick
    const shifted = `${challenge.slice(1)}${challenge.charAt(0)}`;

    await expect(checkGuesses(puzzle, game, [shifted])).rejects.toMatchObject({
      status: 409
    });
  });

  it(`refuses a jump to a board that's more than one move away`, async () => {
    await expect(checkGuesses(puzzle, game, [twoMoves])).rejects.toMatchObject({
      status: 409
    });
  });

  it(`follows a game from one answer to the next`, async () => {
    const { from } = await checkGuesses(puzzle, game, [oneMove]);
    const { hints } = await checkGuesses(puzzle, game, [twoMoves], from);

    expect(hints).toHaveLength(1);
  });

  it(`checks moves made while waiting on the server together`, async () => {
    // A slow connection sends several moves at once, each of which has to follow from the last
    const { hints } = await checkGuesses(puzzle, game, [oneMove, twoMoves]);

    expect(hints).toHaveLength(2);
  });

  it(`refuses a batch with a jump anywhere in it`, async () => {
    await expect(
      checkGuesses(puzzle, game, [oneMove, `a`.repeat(25)])
    ).rejects.toMatchObject({ status: 409 });
  });

  it(`says nothing at all about a batch that it refuses`, async () => {
    // Otherwise the real move at the front of a batch could carry guesses that aren't
    const refused = await checkGuesses(puzzle, game, [
      oneMove,
      `b`.repeat(25)
    ]).catch((error: unknown) => error);

    expect(JSON.stringify(refused)).not.toContain(`ABCDE`);
  });

  it(`refuses a note that was tampered with`, async () => {
    // A forged note would let a guess start from any board at all
    const { from } = await checkGuesses(puzzle, game, [oneMove]);
    const [, signature] = from.split(`.`);

    await expect(
      checkGuesses(puzzle, game, [oneMove], `${`a`.repeat(25)}.${signature}`)
    ).rejects.toMatchObject({ status: 409 });
  });

  it(`refuses a note from another puzzle`, async () => {
    const note = await vouchForBoard(other, oneMove);

    await expect(
      checkGuesses(puzzle, game, [twoMoves], note)
    ).rejects.toMatchObject({ status: 409 });
  });

  it(`refuses guesses that make no move at all`, async () => {
    await expect(checkGuesses(puzzle, game, [``])).rejects.toMatchObject({
      status: 409
    });
  });
});

describe(`a note of a board`, () => {
  it(`gives back the board that it was written for`, async () => {
    await expect(
      readBoard(puzzle, await vouchForBoard(puzzle, oneMove))
    ).resolves.toBe(oneMove);
  });

  it(`is worth nothing without its signature`, async () => {
    await expect(readBoard(puzzle, oneMove)).resolves.toBeNull();
    await expect(readBoard(puzzle, `${oneMove}.`)).resolves.toBeNull();
  });
});
