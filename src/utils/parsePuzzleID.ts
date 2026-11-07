import { parseSize } from "./parseSize";
import type { Size } from "./sizes";

/**
 * The parts of a puzzle's ID, which is `MM-DD-YYYY_5x5`: the day that it's the
 * day's puzzle for, and the size of its board.
 */
export const parsePuzzleID = (
  puzzleID: string
): { day: string; dimensions: string; label: string } => {
  const [day, dimensions = ``] = puzzleID.split(`_`);

  return { day, dimensions, label: dimensions.replace(`x`, `×`) };
};

/** The size of the board of the puzzle with the given ID */
export const getPuzzleSize = (
  puzzleID: string
): { width: Size; height: Size } =>
  parseSize(parsePuzzleID(puzzleID).dimensions);
