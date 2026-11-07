const DAY = 24 * 60 * 60 * 1000;

/**
 * Numbers a day, given as `MM-DD-YYYY`, by how many days it is after the
 * start of 1970. Days that follow one another are numbered one apart,
 * whatever months or years they fall in, which is what makes a run of them
 * easy to spot.
 */
export const toDayNumber = (day: string): number => {
  const [month, date, year] = day.split(`-`).map(Number);

  return Date.UTC(year, month - 1, date) / DAY;
};

export interface Streaks {
  /** How many days in a row the player has played, up to now */
  readonly current: number;
  /** The most days in a row that they have ever played */
  readonly best: number;
}

/**
 * Works out a player's streaks from the days that they played on.
 *
 * A day counts once the player has solved any one of its puzzles. A streak
 * that reached yesterday is still going, as today isn't over: it only ends
 * once a whole day has passed without a puzzle being solved.
 */
export const getStreaks = (days: readonly string[], today: string): Streaks => {
  const played = [...new Set(days.map(toDayNumber))].sort((a, b) => a - b);
  const now = toDayNumber(today);
  let best = 0;
  let run = 0;
  let current = 0;

  played.forEach((day, index) => {
    run = index > 0 && day === played[index - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
    // The run that reaches today or yesterday is the one that is still going
    if (day === now || day === now - 1) current = run;
  });

  return { current, best };
};
