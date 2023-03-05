import React, { memo, useCallback } from "react";
import { Direction } from "../../../components/Direction";

export interface DirectionInputProps {
  rowOrCol: number;
  dir: `up` | `down` | `left` | `right`;
  disabled: boolean;
  rotate: (rowOrCol: number, dir: `up` | `down` | `left` | `right`) => void;
}

export const DirectionInput: React.FC<DirectionInputProps> = memo(
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
      <Direction
        direction={dir}
        onClick={handleClick}
        aria-label={`Rotate ${axis} ${rowOrCol + 1} ${dir}`}
        disabled={disabled}
      />
    );
  }
);

DirectionInput.displayName = `DirectionInput`;
