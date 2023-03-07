import React, { memo, useCallback } from "react";
import { Character, Hint } from "./elements";

export interface CharacterTileProps {
  x: number;
  y: number;
  char: string;
  hint: string;
  correct: boolean;
  disabled: boolean;
  rotate: (rowOrCol: number, dir: `up` | `down` | `left` | `right`) => void;
}

export const CharacterTile: React.FC<CharacterTileProps> = memo(
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
            rotate(axis ? x : y, dir[key]);
          }
        },
        [rotate, x, y]
      );

    return (
      <Character
        key={`char-${x}${y}`}
        $hint={char.toUpperCase() === hint}
        $correct={correct}
        onKeyDown={handleKeypress}
        aria-label={`Grid tile ${x + 1}, ${
          y + 1
        }. Current character is ${char}.${
          hint === ` ` ? `` : ` Correct character for this tile is ${hint}.`
        }`}
        disabled={disabled}
      >
        {char.toUpperCase()}
        <Hint>{hint}</Hint>
      </Character>
    );
  }
);

CharacterTile.displayName = `CharacterTile`;
