"use client";
/* eslint-disable react/no-array-index-key */
import React from "react";
import {
  Composite,
  CompositeGroup,
  CompositeRow,
  useCompositeStore
} from "@ariakit/react";
import { Direction } from "../../Direction";
import { Tile } from "../../Tile";
import type { usePuzzle } from "../usePuzzleState";
import { useRotate } from "./useRotate";
import styles from "./Puzzle.module.css";
// eslint-disable-next-line import/first
import { range } from "#utils";

export interface PuzzleProps {
  readonly puzzleID: string;
  readonly state: ReturnType<typeof usePuzzle>;
}

export const Puzzle: React.FC<PuzzleProps> = ({ puzzleID, state }) => {
  const grid = useCompositeStore();
  const rotate = useRotate(puzzleID, state);
  const repeat = range(state.initial.width);

  return (
    <Composite
      store={grid}
      style={{ "--items": state.initial.width } as React.CSSProperties}
      className={styles.container}
    >
      <CompositeGroup className={styles.grid}>
        <CompositeRow className={styles.row}>
          {repeat.map((y) => (
            <Direction
              key={`up-${y}`}
              rowOrCol={y}
              dir="up"
              disabled={state.win}
              rotate={rotate}
            />
          ))}
        </CompositeRow>
        {state.current.matrix.map((row, x) => {
          const word = row.join(``);
          return (
            <CompositeRow key={`row-${x}`} className={styles.row}>
              <Direction
                key={`left-${x}`}
                rowOrCol={x}
                dir="left"
                disabled={state.win}
                rotate={rotate}
              />
              {row.map((char, y) => {
                const hint = state.hints[x][y];
                const correct = word.toUpperCase() === state.hints[x].join(``);
                return (
                  <Tile
                    key={`char-${x}${y}`}
                    x={x}
                    y={y}
                    char={char}
                    hint={hint}
                    correct={correct}
                    disabled={state.win}
                    rotate={rotate}
                  />
                );
              })}
              <Direction
                key={`right-${x}`}
                rowOrCol={x}
                dir="right"
                disabled={state.win}
                rotate={rotate}
              />
            </CompositeRow>
          );
        })}
        <CompositeRow className={styles.row}>
          {repeat.map((y) => (
            <Direction
              key={`down-${y}`}
              rowOrCol={y}
              dir="down"
              disabled={state.win}
              rotate={rotate}
            />
          ))}
        </CompositeRow>
      </CompositeGroup>
    </Composite>
  );
};
