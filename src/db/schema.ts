import { index, integer, primaryKey, sqliteTable, text } from "void/schema-d1";

/**
 * The score that each player earned on each puzzle.
 *
 * A player has one score per puzzle, which is that of the first game of
 * theirs to be verified. Only what a leaderboard shows is kept: the moves a
 * game went through are checked when it's submitted, and then discarded.
 */
export const scores = sqliteTable(
  `scores`,
  {
    /** The ID of the puzzle that was solved, e.g. `11-05-2026_5x5` */
    puzzle: text(`puzzle`).notNull(),
    /** The ATProto identity of the player */
    did: text(`did`).notNull(),
    /** The player's handle at the time, if it could be confirmed to be theirs */
    handle: text(`handle`),
    /** How many moves the puzzle was solved in */
    moves: integer(`moves`).notNull(),
    createdAt: integer(`created_at`, { mode: `timestamp_ms` }).notNull()
  },
  (table) => [
    primaryKey({ columns: [table.puzzle, table.did] }),
    // Ranks the scores of a puzzle: fewest moves first, and the earliest of those that tie
    index(`scores_ranking`).on(table.puzzle, table.moves, table.createdAt),
    // Finds everything that one player has scored, latest first, for their profile
    index(`scores_player`).on(table.did, table.createdAt)
  ]
);
