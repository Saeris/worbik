/**
 * Compares a guess string to a solution string,
 * uppercasing any positional characters that match.
 */
export const checkSolution = (guess: string, solution: string): string =>
  guess
    .toLowerCase()
    .split(``)
    .map((c, i) => (solution.charAt(i) === c ? c.toUpperCase() : c))
    .join(``);
