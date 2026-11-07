/**
 * Picks the few rows of a ranking that are worth showing in a small space:
 * the ones around the given entry, or the top of the ranking when the entry
 * isn't in it.
 *
 * Returns those rows along with the place of the first of them.
 */
export const getNeighbors = <T>(
  ranking: readonly T[],
  isSelf: (entry: T) => boolean,
  count = 3
): { rows: readonly T[]; from: number } => {
  const index = ranking.findIndex(isSelf);
  // Centered on the entry, but never running off of either end of the ranking
  const start = Math.max(
    0,
    Math.min(index - Math.floor(count / 2), ranking.length - count)
  );

  return { rows: ranking.slice(start, start + count), from: start + 1 };
};
