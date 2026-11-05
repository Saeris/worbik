/* eslint-disable react/no-array-index-key */
import {
  Composite,
  CompositeGroup,
  CompositeRow,
  useCompositeStore
} from "@ariakit/react";
import { Tile } from "#components/Tile";
import { Direction } from "#components/Direction";
import { range } from "#utils";
import type { usePuzzle } from "#hooks";
import styles from "./Puzzle.module.css";

export interface PuzzleProps {
  readonly state: ReturnType<typeof usePuzzle>;
}

export const Puzzle: React.FC<PuzzleProps> = ({ state }) => {
  const grid = useCompositeStore();
  const repeat = range(state.initial.width);

  return (
    <Composite
      store={grid}
      style={
        {
          "--columns": state.initial.width,
          "--rows": state.initial.height
        } as React.CSSProperties
      }
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
              rotate={state.rotate}
            />
          ))}
        </CompositeRow>
        {state.current.matrix.map((row, x) => (
          <CompositeRow key={`row-${x}`} className={styles.row}>
            <Direction
              key={`left-${x}`}
              rowOrCol={x}
              dir="left"
              disabled={state.win}
              rotate={state.rotate}
            />
            {row.map((char, y) => (
              <Tile
                key={`char-${x}${y}`}
                x={x}
                y={y}
                char={char}
                hint={state.getHintAt(x, y)}
                solved={state.isRowCorrect(x)}
                disabled={state.win}
                rotate={state.rotate}
              />
            ))}
            <Direction
              key={`right-${x}`}
              rowOrCol={x}
              dir="right"
              disabled={state.win}
              rotate={state.rotate}
            />
          </CompositeRow>
        ))}
        <CompositeRow className={styles.row}>
          {repeat.map((y) => (
            <Direction
              key={`down-${y}`}
              rowOrCol={y}
              dir="down"
              disabled={state.win}
              rotate={state.rotate}
            />
          ))}
        </CompositeRow>
      </CompositeGroup>
    </Composite>
  );
};
