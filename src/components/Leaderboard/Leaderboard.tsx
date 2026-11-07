import { memo, useCallback, useEffect, useId, useMemo, useState } from "react";
import { PiCaretLeftThin, PiCaretRightThin } from "react-icons/pi";
import { loadScores, usePlayer, type Ranking } from "#hooks";
import {
  getPuzzleID,
  getPuzzleStart,
  parseSize,
  PUZZLE_DAY,
  sizes,
  type Size
} from "#utils";
import { Scores } from "../Scores";
import styles from "./Leaderboard.module.css";

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: `short`,
  month: `short`,
  day: `numeric`,
  // A puzzle's day is named for the date that it begins on, wherever it's being read
  timeZone: `UTC`
});

export interface LeaderboardProps {
  /** The ID of the puzzle that is being played, which is the latest day there is a leaderboard for */
  puzzleID: string;
  width: Size;
  height: Size;
  /** Called when a player who isn't signed in asks to be */
  onSignIn: () => void;
}

/**
 * The ranking of everyone who posted a score for a puzzle: those who solved
 * it in the fewest moves, and the earliest of any that tie. There is one for
 * every size of board, for every day.
 *
 * It loads its scores when it's shown, so it should only be rendered once
 * it's wanted.
 */
export const Leaderboard: React.FC<LeaderboardProps> = memo(
  ({ puzzleID, width, height, onSignIn }) => {
    const id = useId();
    const you = usePlayer()?.did;
    const [size, setSize] = useState(`${width}x${height}`);
    /** How many days before the puzzle that is being played */
    const [ago, setAgo] = useState(0);
    const [loaded, setLoaded] = useState<{
      puzzle: string;
      ranking: Ranking | null;
    } | null>(null);

    const day = new Date(getPuzzleStart(puzzleID) - ago * PUZZLE_DAY);
    const puzzle: string = getPuzzleID(parseSize(size), day);
    const ranking = loaded?.puzzle === puzzle ? loaded.ranking : undefined;

    useEffect(() => {
      // Set when another day or size has been picked, so that these scores aren't shown in place of those
      const stale = new AbortController();

      const load = async (): Promise<void> => {
        const result = await loadScores(puzzle, you);
        if (!stale.signal.aborted) setLoaded({ puzzle, ranking: result });
      };

      void load();

      return (): void => {
        stale.abort();
      };
    }, [puzzle, you]);

    const earlier = useCallback(() => {
      setAgo((days) => days + 1);
    }, []);

    const later = useCallback(() => {
      setAgo((days) => Math.max(0, days - 1));
    }, []);

    const pickSize: React.ChangeEventHandler<HTMLSelectElement> = useCallback(
      ({ currentTarget }) => {
        setSize(currentTarget.value);
      },
      []
    );

    // A player beyond the end of what's listed still gets to see where they stand
    const yours = useMemo(
      () =>
        ranking?.you && ranking.you.place > ranking.scores.length
          ? [ranking.you]
          : null,
      [ranking]
    );

    const label = size.replace(`x`, `×`);

    return (
      <div className={styles.board}>
        <div className={styles.controls}>
          <div className={styles.day}>
            <button type="button" aria-label="Earlier day" onClick={earlier}>
              <PiCaretLeftThin aria-hidden />
            </button>
            <span aria-live="polite">
              {ago === 0 ? `Today` : dayFormat.format(day)}
            </span>
            <button
              type="button"
              aria-label="Later day"
              disabled={ago === 0}
              onClick={later}
            >
              <PiCaretRightThin aria-hidden />
            </button>
          </div>
          <label htmlFor={`${id}-size`} className={styles.label}>
            Board size
          </label>
          <select
            id={`${id}-size`}
            className={styles.size}
            value={size}
            onChange={pickSize}
          >
            {sizes.map(([columns, rows]) => (
              <option key={`${columns}x${rows}`} value={`${columns}x${rows}`}>
                {`${columns}×${rows}`}
              </option>
            ))}
          </select>
        </div>
        {ranking === undefined ? (
          <p className={styles.empty}>Loading…</p>
        ) : ranking === null ? (
          <p className={styles.empty}>
            Couldn’t load these scores. Check your connection and try again.
          </p>
        ) : ranking.total === 0 ? (
          <div className={styles.empty}>
            <strong>No scores yet</strong>
            {ago === 0 ? (
              <p>{`Be the first to solve today’s ${label}.`}</p>
            ) : (
              <p>{`Nobody posted a score for this ${label}.`}</p>
            )}
          </div>
        ) : (
          <>
            <Scores scores={ranking.scores} you={you} />
            {yours && <Scores scores={yours} from={yours[0].place} you={you} />}
            <p className={styles.note}>
              {`${ranking.total === 1 ? `1 player` : `${ranking.total} players`} posted a score${ranking.total > ranking.scores.length ? `, and the top ${ranking.scores.length} are listed` : ``}. Fewest moves wins; ties go to whoever posted first.`}
            </p>
          </>
        )}
        {!you && (
          <div className={styles.join}>
            <button type="button" onClick={onSignIn}>
              Sign in to post scores
            </button>
            <p className={styles.note}>
              You can play without an account. Signing in only adds you to the
              leaderboard.
            </p>
          </div>
        )}
      </div>
    );
  }
);

Leaderboard.displayName = `Leaderboard`;
