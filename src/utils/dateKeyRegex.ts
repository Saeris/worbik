/** A puzzle's day, as `MM-DD-YYYY` */
const day = String.raw`\d{2}-\d{2}-\d{4}`;

/** Matches a day that puzzles can belong to */
export const dayRegex = new RegExp(`^${day}$`, `u`);

/**
 * Matches the ID of a puzzle. These arrive from outside, and are matched on
 * the busiest route there is, so this has to take the same time to give up
 * however long an ID is: no part of it can be repeated.
 */
export const dateKeyRegex = new RegExp(
  `^(?<date>${day})_(?<width>\\d)x(?<height>\\d)$`,
  `u`
);
