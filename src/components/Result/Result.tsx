import { memo } from "react";
import { cx } from "class-variance-authority";
import { usePlayer, type RankedScore, type ScoreStatus } from "#hooks";
import type { Size } from "#utils";
import { getNeighbors } from "#utils/getNeighbors";
import { ordinal } from "#utils/ordinal";
import { LEADERBOARD } from "../Leaderboard";
import { Scores } from "../Scores";
import { Share } from "../Share";
import { SIGN_IN } from "../SignIn";
import styles from "./Result.module.css";

export interface ResultProps {
  /** The ID of the puzzle that was solved */
  puzzleID: string;
  width: Size;
  height: Size;
  /** How many moves the puzzle was solved in */
  moves: number;
  /** How many moves the puzzle was scrambled with, which is the score to beat */
  target: number;
  /** What has become of the solve, once that's known */
  status: ScoreStatus | null;
  /** The puzzle's leaderboard, once it has loaded */
  scores: readonly RankedScore[] | null;
  /** Tries again to post a solve that couldn't be posted */
  retry: () => void;
  /** Called when the leaderboard is opened, so that it can be loaded */
  onLeaderboard: () => void;
  className?: string;
}

/**
 * What a player is shown once they solve a puzzle: how they did, how that
 * compares to everyone else who solved it that day, and what they can do
 * next.
 */
export const Result: React.FC<ResultProps> = memo(
  ({
    puzzleID,
    width,
    height,
    moves,
    target,
    status,
    scores,
    retry,
    onLeaderboard,
    className
  }) => {
    const you = usePlayer()?.did;
    const size = `${width}×${height}`;
    const { rows, from } = getNeighbors(scores ?? [], ({ did }) => did === you);
    const place = (scores ?? []).findIndex(({ did }) => did === you) + 1;
    const mine = scores?.[place - 1];
    // Sharing is the thing to do next unless there is something that needs doing first
    const waiting =
      status === `signed-out` ||
      status === `expired` ||
      status === `failed` ||
      status === `closed`;

    return (
      <section className={cx(styles.result, className)} aria-label="Result">
        <div className={styles.summary}>
          <h2>{`Solved in ${moves} ${moves === 1 ? `move` : `moves`}`}</h2>
          {status === `posted` && place > 0 ? (
            <p>
              <strong>{ordinal(place)}</strong>
              {` of ${scores?.length} today`}
            </p>
          ) : status === `closed` ? (
            <p>
              This puzzle’s day ended before you finished, so the solve isn’t
              ranked.
            </p>
          ) : status === `posting` ? (
            <p>Posting your score…</p>
          ) : (
            // The target is only revealed by a win: seeing it while playing discourages those who are behind it
            <p>{`The target was ${target}.`}</p>
          )}
        </div>
        {status === `failed` && (
          <p role="alert" className={styles.alert}>
            <strong>Couldn’t post your score</strong>
            Your solve is saved on this device. Try again before this puzzle’s
            day ends, and it will still count.
          </p>
        )}
        {status === `expired` && (
          <p role="alert" className={styles.alert}>
            <strong>Your sign-in has run out</strong>
            Sign in again to post your score. Your solve is saved on this
            device.
          </p>
        )}
        <div className={styles.actions}>
          {status === `signed-out` && (
            <button
              type="button"
              className={styles.action}
              command="show-modal"
              commandfor={SIGN_IN}
            >
              Post my score
            </button>
          )}
          {status === `expired` && (
            <button
              type="button"
              className={styles.action}
              command="show-modal"
              commandfor={SIGN_IN}
            >
              Sign in again
            </button>
          )}
          {status === `failed` && (
            <button type="button" className={styles.action} onClick={retry}>
              Try again
            </button>
          )}
          {status === `closed` && (
            // A plain link, so that the page is loaded afresh with whichever puzzle is now the day's
            <a className={styles.action} href={`/${width}x${height}`}>
              {`Play today’s ${size}`}
            </a>
          )}
          <Share
            className={waiting ? styles.other : styles.action}
            puzzleID={puzzleID}
            moves={moves}
            // A link can only show a score that is on the leaderboard, under the name that it's listed by there
            player={
              status === `posted` && mine
                ? (mine.handle ?? mine.did)
                : undefined
            }
          />
        </div>
        {rows.length > 0 && (
          <div className={styles.ranking}>
            <header>
              <h3>
                {status === `closed` ? `${size} scores` : `Today’s ${size}`}
              </h3>
              <button
                type="button"
                command="show-modal"
                commandfor={LEADERBOARD}
                onClick={onLeaderboard}
              >
                {`See all ${scores?.length}`}
              </button>
            </header>
            <Scores scores={rows} from={from} you={you} />
          </div>
        )}
      </section>
    );
  }
);

Result.displayName = `Result`;
