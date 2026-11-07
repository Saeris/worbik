import { memo } from "react";
import { cx } from "class-variance-authority";
import type { RankedScore } from "#hooks";
import styles from "./Scores.module.css";

export interface ScoresProps {
  /** The scores to list, in the order that they rank */
  scores: readonly RankedScore[];
  /** The place of the first of the scores, for a list that doesn't begin at the top of its leaderboard */
  from?: number;
  /** The identity of the player who is looking, whose own score is picked out */
  you?: string;
  className?: string;
}

/** A run of places on a leaderboard */
export const Scores: React.FC<ScoresProps> = memo(
  ({ scores, from = 1, you, className }) => (
    <ol className={cx(styles.scores, className)} start={from}>
      {scores.map(({ did, handle, moves }, index) => (
        <li key={did} aria-current={did === you ? `true` : undefined}>
          <span className={styles.place}>{from + index}</span>
          {/* A player whose handle couldn't be confirmed is still on the board, under the identity that could be */}
          <span className={styles.who}>{handle ? `@${handle}` : did}</span>
          {did === you && <em>You</em>}
          <span className={styles.moves}>{moves}</span>
        </li>
      ))}
    </ol>
  )
);

Scores.displayName = `Scores`;
