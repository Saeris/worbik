import React, { memo, useCallback } from "react";
import { Button } from "@ariakit/react";
import { cva } from "class-variance-authority";
import {
  PiCaretDownThin as Down,
  PiCaretUpThin as Up,
  PiCaretLeftThin as Left,
  PiCaretRightThin as Right
} from "react-icons/pi";
import styles from "./Direction.module.css";

const variants = cva(styles.button, {
  variants: {
    orientation: {
      vertical: styles.vertical,
      horizontal: styles.horizontal
    }
  }
});

const directions = {
  up: <Up />,
  down: <Down />,
  left: <Left />,
  right: <Right />
};

export interface DirectionProps {
  rowOrCol: number;
  dir: `up` | `down` | `left` | `right`;
  disabled: boolean;
  rotate: (rowOrCol: number, dir: `up` | `down` | `left` | `right`) => void;
}

export const Direction: React.FC<DirectionProps> = memo(
  ({ rowOrCol, dir, disabled, rotate }) => {
    const axis = [`up`, `down`].includes(dir) ? `column` : `row`;
    const handleClick: React.MouseEventHandler<HTMLButtonElement> = useCallback(
      (e) => {
        e.preventDefault();
        rotate(rowOrCol, dir);
      },
      [rotate, rowOrCol, dir]
    );

    return (
      <Button
        type="button"
        tabIndex={-1}
        onClick={handleClick}
        className={variants({
          orientation: [`up`, `down`].includes(dir) ? `vertical` : `horizontal`
        })}
        aria-label={`Rotate ${axis} ${rowOrCol + 1} ${dir}`}
        disabled={disabled}
      >
        {directions[dir]}
      </Button>
    );
  }
);

Direction.displayName = `Direction`;
