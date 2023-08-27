"use client";
import React, { memo, useCallback } from "react";
import { CompositeItem } from "@ariakit/react";
import { cva } from "class-variance-authority";
import styles from "./Tile.module.css";

const variants = cva(styles.tile, {
  variants: {
    variant: {
      hint: styles.hint,
      correct: styles.correct
    }
  }
});

export interface TileProps {
  x: number;
  y: number;
  char: string;
  hint?: string;
  correct?: boolean;
  disabled?: boolean;
  rotate?: (rowOrCol: number, dir: `down` | `left` | `right` | `up`) => void;
}

export const Tile: React.FC<TileProps> = memo(
  ({ x, y, char, hint, correct, disabled, rotate }) => {
    const handleKeypress: React.KeyboardEventHandler<HTMLButtonElement> =
      useCallback(
        (e) => {
          const key = e.key;
          if ([`w`, `a`, `s`, `d`].includes(key)) {
            // w | d = increment, a | s = decriment
            const dir = {
              w: `up`,
              a: `left`,
              s: `down`,
              d: `right`
            };
            // a | d = horizontal, w | s = veritcal
            const axis = [`a`, `d`].includes(key);
            if (rotate) {
              rotate(axis ? x : y, dir[key]);
            }
          }
        },
        [rotate, x, y]
      );

    const variant = correct
      ? `correct`
      : char.toUpperCase() === hint
      ? `hint`
      : null;

    return (
      <CompositeItem
        key={`char-${x}${y}`}
        onKeyDown={handleKeypress}
        aria-label={`Grid tile ${x + 1}, ${
          y + 1
        }. Current character is ${char}.${
          hint === ` ` ? `` : ` Correct character for this tile is ${hint}.`
        }`}
        disabled={disabled}
        className={variants({ variant })}
      >
        {char.toUpperCase()}
        <span>{hint}</span>
      </CompositeItem>
    );
  }
);

Tile.displayName = `Tile`;
