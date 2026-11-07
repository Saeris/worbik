import { memo, useCallback, useMemo, useState } from "react";
import {
  DialogDisclosure,
  DialogHeading,
  useDialogStore
} from "@ariakit/react";
import { Link } from "@void/react";
import { cx } from "class-variance-authority";
import { PiCaretDownThin } from "react-icons/pi";
import { getPuzzleStart, PUZZLE_DAY, sizes, type Size } from "#utils";
import { formatCountdown, getProgress, type Progress } from "#utils/progress";
import { getGameKey } from "#utils/solves";
import { usePlayer } from "#hooks";
import { Sheet } from "../Sheet";
import styles from "./SizePicker.module.css";

export interface SizePickerProps {
  /** The ID of the puzzle that is being played, which says which day's puzzles to list */
  puzzleID: string;
  /** The width of the board that is being played */
  width: Size;
  /** The height of the board that is being played */
  height: Size;
  className?: string;
}

/** How far the player has got with each of the day's puzzles, by the size of its board */
const readDay = (
  puzzleID: string,
  did?: string
): Record<string, Progress | null> => {
  const [day] = puzzleID.split(`_`);

  return Object.fromEntries(
    sizes.map(([columns, rows]) => {
      const size = `${columns}x${rows}`;

      try {
        return [
          size,
          getProgress(localStorage.getItem(getGameKey(`${day}_${size}`, did)))
        ];
      } catch {
        // Storage can be unavailable, e.g. when site data is blocked
        return [size, null];
      }
    })
  );
};

interface TodayProps extends Omit<SizePickerProps, "className"> {
  /** When the list was opened, in milliseconds since the epoch */
  now: number;
  /** Called when a puzzle is picked */
  onPick: () => void;
}

/**
 * The day's puzzles, with how the player has done on each. It's only
 * rendered while the sheet is open, so what it shows is read at that moment.
 */
const Today: React.FC<TodayProps> = ({
  puzzleID,
  width,
  height,
  now,
  onPick
}) => {
  const did = usePlayer()?.did;
  const day = useMemo(() => readDay(puzzleID, did), [puzzleID, did]);
  // How long until the next day's puzzles take the place of these
  const left = getPuzzleStart(puzzleID) + PUZZLE_DAY - now;
  const solved = Object.values(day).filter((game) => game?.solved).length;

  return (
    <>
      <header className={styles.header}>
        <DialogHeading className={styles.heading}>
          Today’s puzzles
        </DialogHeading>
        <span>{`${solved} of ${sizes.length} solved`}</span>
      </header>
      <nav className={styles.sizes} aria-label="Board sizes">
        {sizes.map(([columns, rows]) => {
          const game = day[`${columns}x${rows}`];
          const size = `${columns}×${rows}`;
          const moves =
            game && `${game.moves} ${game.moves === 1 ? `move` : `moves`}`;

          return (
            <Link
              key={size}
              className={cx(
                styles.size,
                game && (game.solved ? styles.solved : styles.started)
              )}
              href={`/${columns}x${rows}`}
              aria-current={
                columns === width && rows === height ? `page` : undefined
              }
              // There is only room to show a number, so what it's a number of is said here
              aria-label={
                game
                  ? `${size}, ${game.solved ? `solved in` : `playing, at`} ${moves}`
                  : `${size}, not played`
              }
              // The page that's linked to may be the one that's already open
              onClick={onPick}
            >
              {size}
              <small>
                {game ? `${game.moves}${game.solved ? `` : `…`}` : `–`}
              </small>
            </Link>
          );
        })}
      </nav>
      <p className={styles.note}>
        {`Each size is its own puzzle, with its own leaderboard.${left > 0 ? ` New puzzles in ${formatCountdown(left)}.` : ``}`}
      </p>
    </>
  );
};

/**
 * Names the size of the board that is being played, and opens the list of
 * the day's puzzles, of which there is one for every size of board
 */
export const SizePicker: React.FC<SizePickerProps> = memo(
  ({ puzzleID, width, height, className }) => {
    const picker = useDialogStore();
    const [opened, setOpened] = useState(0);

    const noteTime = useCallback(() => {
      setOpened(Date.now());
    }, []);

    return (
      <>
        <DialogDisclosure
          store={picker}
          className={cx(styles.open, className)}
          aria-label={`Board size: ${width}×${height}`}
          onClick={noteTime}
        >
          {`${width}×${height}`}
          <PiCaretDownThin aria-hidden />
        </DialogDisclosure>
        <Sheet store={picker}>
          <Today
            puzzleID={puzzleID}
            width={width}
            height={height}
            now={opened}
            onPick={picker.hide}
          />
        </Sheet>
      </>
    );
  }
);

SizePicker.displayName = `SizePicker`;
