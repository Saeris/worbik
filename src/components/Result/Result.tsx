import { memo } from "react";
import { cx } from "class-variance-authority";
import { usePlayer, type RankedScore, type ScoreStatus } from "#hooks";
import type { Size } from "#utils";
import { getNeighbors } from "#utils/getNeighbors";
import { ordinal } from "#utils/ordinal";
import { Scores } from "../Scores";
import { Share } from "../Share";
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
  /** Why the solve couldn't be posted, in the words of whatever turned it away */
  detail: string | null;
  /** Whether a solve that couldn't be posted is being posted again */
  retrying: boolean;
  /** Tries again to post a solve that couldn't be posted */
  retry: () => void;
  /** Called to see the whole leaderboard */
  onLeaderboard: () => void;
  /** Called when a player asks to sign in, which is how a score gets posted */
  onSignIn: () => void;
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
    detail,
    retrying,
    retry,
    onLeaderboard,
    onSignIn,
    className
  }) => {
    const you = usePlayer()?.did;
    const size = `${width}×${height}`;
    const { rows, from } = getNeighbors(scores ?? [], ({ did }) => did === you);
    const place = (scores ?? []).findIndex(({ did }) => did === you) + 1;
    const mine = scores?.[place - 1];
    // A failure stays on show while the solve is being posted again, so that nothing moves while it is
    const shown = retrying ? `failed` : status;
    // Sharing is the thing to do next unless there is something that needs doing first
    const waiting =
      shown === `expired` || shown === `failed` || shown === `closed`;

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
        {shown === `failed` && (
          <p role="alert" className={styles.alert}>
            <strong>Couldn’t post your score</strong>
            Your solve is saved on this device. Try again before this puzzle’s
            day ends, and it will still count.
            {detail && <small>{detail}</small>}
          </p>
        )}
        {shown === `expired` && (
          <p role="alert" className={styles.alert}>
            <strong>Your sign-in has run out</strong>
            Sign in again to post your score. Your solve is saved on this
            device.
          </p>
        )}
        <div className={styles.actions}>
          {shown === `expired` && (
            <button type="button" className={styles.action} onClick={onSignIn}>
              Sign in again
            </button>
          )}
          {shown === `failed` && (
            <button
              type="button"
              className={styles.action}
              disabled={retrying}
              onClick={retry}
            >
              {retrying ? `Trying again…` : `Try again`}
            </button>
          )}
          {shown === `closed` && (
            // A plain link, so that the page is loaded afresh with whichever puzzle is now the day's
            <a className={styles.action} href={`/${width}x${height}`}>
              {`Play today’s ${size}`}
            </a>
          )}
          <Share
            className={waiting ? styles.other : styles.action}
            puzzleID={puzzleID}
            moves={moves}
            // Posting a score is offered alongside sharing it, to a player who has yet to say who they are
            onSignIn={status === `signed-out` ? onSignIn : undefined}
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
              <button type="button" onClick={onLeaderboard}>
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
