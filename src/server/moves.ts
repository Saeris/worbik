import { HTTPException } from "hono/http-exception";
import { env } from "void/env";
import { isMove, PuzzleState, type Challenge } from "#state";
import { parseSize } from "#utils";

/**
 * Keeps a player's guesses honest, without keeping anything else.
 *
 * Checking a guess says which of its letters are in place, so if any guess
 * would do, a puzzle's solution could be read straight out of the answers:
 * guess nothing but A's, then nothing but B's, and so on. Boards that are
 * only rearrangements of the puzzle's letters give it away just as quickly.
 *
 * So a guess has to be a board that a real move leads to. For that, the
 * server has to know where the player is, and it can't keep track of that
 * itself: this is the busiest route there is, and has to stay stateless.
 * Instead, every answer comes with a note of the board that it reached,
 * signed so that it can't be forged, which the player hands back with their
 * next guess.
 *
 * This can't stop someone from playing a puzzle with real moves in order to
 * learn it, as nothing can tell that apart from playing it. But it does turn
 * reading out the answer into having to solve the puzzle.
 */

const encoder = new TextEncoder();

/** The key that notes are signed with, which is only worked out once */
let key: Promise<CryptoKey> | undefined;

const getKey = async (): Promise<CryptoKey> => {
  key ??= crypto.subtle.importKey(
    `raw`,
    // Kept apart from how the same secret is used to make puzzles
    encoder.encode(`moves:${env.PUZZLE_SECRET}`),
    { name: `HMAC`, hash: `SHA-256` },
    false,
    [`sign`]
  );

  return key;
};

/** A signature of a board on a puzzle, which says nothing about any other */
const sign = async (puzzleID: string, board: string): Promise<string> => {
  const signature = await crypto.subtle.sign(
    `HMAC`,
    await getKey(),
    encoder.encode(`${puzzleID}:${board}`)
  );

  return btoa(String.fromCodePoint(...new Uint8Array(signature)))
    .replaceAll(`+`, `-`)
    .replaceAll(`/`, `_`)
    .replaceAll(`=`, ``);
};

/** Writes a note of a board that a player has reached */
export const vouchForBoard = async (
  puzzleID: string,
  board: string
): Promise<string> => `${board}.${await sign(puzzleID, board)}`;

/** Reads the board out of a note, or `null` if the note wasn't written by this server for this puzzle */
export const readBoard = async (
  puzzleID: string,
  note: string
): Promise<string | null> => {
  const [board = ``, signature] = note.split(`.`);

  return signature === (await sign(puzzleID, board)) ? board : null;
};

/**
 * Checks guesses against a puzzle's solution. Each is returned with the
 * letters that are in their correct position uppercased, along with a note
 * of the last of them, for the next guess to be made from.
 *
 * The first guess has to be a move from the board in the note, or from how
 * the puzzle begins if there is no note, and each after it a move from the
 * one before.
 */
export const checkGuesses = async (
  puzzleID: string,
  [, challenge, solution]: Challenge,
  guesses: readonly string[],
  note?: string
): Promise<{ hints: string[]; from: string }> => {
  const { width } = parseSize(puzzleID.split(`_`)[1]);
  let board = note ? await readBoard(puzzleID, note) : challenge.toLowerCase();

  for (const guess of guesses) {
    const next = guess.toLowerCase();

    if (board === null || !isMove(width, board, next)) {
      throw new HTTPException(409, {
        message: `That guess isn't a move from where the game is`
      });
    }

    board = next;
  }

  return {
    hints: guesses.map((guess) => PuzzleState.compare(guess, solution)),
    from: await vouchForBoard(puzzleID, board ?? ``)
  };
};
