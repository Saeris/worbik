import { memo } from "react";
import {
  DialogDisclosure,
  DialogHeading,
  useDialogStore
} from "@ariakit/react";
import { Link } from "@void/react";
import { cx } from "class-variance-authority";
import { PiCaretDownThin } from "react-icons/pi";
import { sizes, type Size } from "#utils";
import { Sheet } from "../Sheet";
import styles from "./SizePicker.module.css";

export interface SizePickerProps {
  /** The width of the board that is being played */
  width: Size;
  /** The height of the board that is being played */
  height: Size;
  className?: string;
}

/**
 * Names the size of the board that is being played, and opens the list of
 * the day's puzzles, of which there is one for every size of board
 */
export const SizePicker: React.FC<SizePickerProps> = memo(
  ({ width, height, className }) => {
    const picker = useDialogStore();

    return (
      <>
        <DialogDisclosure
          store={picker}
          className={cx(styles.open, className)}
          aria-label={`Board size: ${width}×${height}`}
        >
          {`${width}×${height}`}
          <PiCaretDownThin aria-hidden />
        </DialogDisclosure>
        <Sheet store={picker}>
          <DialogHeading className={styles.heading}>
            Today’s puzzles
          </DialogHeading>
          <nav className={styles.sizes} aria-label="Board sizes">
            {sizes.map(([columns, rows]) => (
              <Link
                key={`${columns}x${rows}`}
                className={styles.size}
                href={`/${columns}x${rows}`}
                aria-current={
                  columns === width && rows === height ? `page` : undefined
                }
                // The page that's linked to may be the one that's already open
                onClick={picker.hide}
              >
                {`${columns}×${rows}`}
              </Link>
            ))}
          </nav>
        </Sheet>
      </>
    );
  }
);

SizePicker.displayName = `SizePicker`;
