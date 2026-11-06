import { memo, useCallback, useEffect, useId, useState } from "react";
import { PiCaretLeftThin, PiCaretRightThin } from "react-icons/pi";
import { loadScores, usePlayer, type RankedScore } from "#hooks";
import {
  getPuzzleID,
  getPuzzleStart,
  parseSize,
  PUZZLE_DAY,
  sizes,
  type Size
} from "#utils";
import { Modal } from "../Modal";
import { Scores } from "../Scores";
import { SIGN_IN } from "../SignIn";
import styles from "./Leaderboard.module.css";

/** Identifies the dialog to the buttons that open it, wherever they are in the game */
export const LEADERBOARD = `leaderboard`;

const dayFormat = new Intl.DateTimeFormat(undefined, {
  weekday: `short`,
  month: `short`,
  day: `numeric`,
  // A puzzle's day is named for the date that it begins on, wherever it's being read
  timeZone: `UTC`
});

interface BoardProps {
  /** The ID of the puzzle that is being played, which is the latest day there is a leaderboard for */
  puzzleID: string;
  width: Size;
  height: Size;
}

/** The contents of the dialog, which only exist while it's open so that nothing is loaded until then */
const Board: React.FC<BoardProps> = ({ puzzleID, width, height }) => {
  const id = useId();
  const you = usePlayer()?.did;
  const [size, setSize] = useState(`${width}x${height}`);
  /** How many days before the puzzle that is being played */
  const [ago, setAgo] = useState(0);
  const [loaded, setLoaded] = useState<{
    puzzle: string;
    scores: readonly RankedScore[] | null;
  } | null>(null);

  const day = new Date(getPuzzleStart(puzzleID) - ago * PUZZLE_DAY);
  const puzzle = getPuzzleID(parseSize(size), day);
  const scores = loaded?.puzzle === puzzle ? loaded.scores : undefined;

  useEffect(() => {
    // Set when another day or size has been picked, so that these scores aren't shown in place of those
    const stale = new AbortController();

    const load = async (): Promise<void> => {
      const result = await loadScores(puzzle);
      if (!stale.signal.aborted) setLoaded({ puzzle, scores: result });
    };

    void load();

    return (): void => {
      stale.abort();
    };
  }, [puzzle]);

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

  const label = size.replace(`x`, `×`);

  return (
    <>
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
      {scores === undefined ? (
        <p className={styles.empty}>Loading…</p>
      ) : scores === null ? (
        <p className={styles.empty}>
          Couldn’t load these scores. Check your connection and try again.
        </p>
      ) : scores.length === 0 ? (
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
          <Scores scores={scores} you={you} />
          <p className={styles.note}>
            {`${scores.length === 1 ? `1 player` : `${scores.length} players`} posted a score. Fewest moves wins; ties go to whoever posted first.`}
          </p>
        </>
      )}
      {!you && (
        <div className={styles.join}>
          <button type="button" command="show-modal" commandfor={SIGN_IN}>
            Sign in to post scores
          </button>
          <p className={styles.note}>
            You can play without an account. Signing in only adds you to the
            leaderboard.
          </p>
        </div>
      )}
    </>
  );
};

export interface LeaderboardProps extends BoardProps {
  /** Whether the dialog has been opened, which is when its scores are loaded */
  open: boolean;
  /** Called when the dialog is closed */
  onClose: () => void;
}

/**
 * The ranking of everyone who posted a score for a puzzle: those who solved
 * it in the fewest moves, and the earliest of any that tie. There is one for
 * every size of board, for every day.
 */
export const Leaderboard: React.FC<LeaderboardProps> = memo(
  ({ open, onClose, ...board }) => (
    <Modal id={LEADERBOARD} title="Leaderboard" onClose={onClose}>
      {open && <Board {...board} />}
    </Modal>
  )
);

Leaderboard.displayName = `Leaderboard`;
