/** How far a player has got with a puzzle */
export interface Progress {
  /** How many moves they have made */
  readonly moves: number;
  /** Whether those moves solved it */
  readonly solved: boolean;
}

/**
 * Reads how far a player has got with a puzzle from the game that their
 * device saved for it, or `null` if they haven't made a move.
 *
 * A saved game is the width of its board, every state that the board has
 * been through, and the letters that are known to be in place, in that
 * order and separated by `|`. The puzzle is solved once every letter is
 * known to be in place, in the state that the board was left in.
 */
export const getProgress = (saved: string | null): Progress | null => {
  const [, history = ``, hints = ``] = saved?.split(`|`) ?? [];
  const states = history.split(`,`);
  const moves = states.length - 1;

  if (moves < 1) return null;

  return { moves, solved: hints.toLowerCase() === states.at(-1) };
};

/** Spells out a length of time that is under a day, to the minute: "6 h 12 min" */
export const formatCountdown = (milliseconds: number): string => {
  const minutes = Math.max(0, Math.ceil(milliseconds / 60_000));
  const hours = Math.floor(minutes / 60);

  return hours ? `${hours} h ${minutes % 60} min` : `${minutes} min`;
};
