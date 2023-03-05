/* eslint-disable react/no-array-index-key */
import React from "react";
import { useCompositeState } from "ariakit/composite/composite-state";
import { range } from "../../../utils";
import { Container, Grid, Row } from "./elements";
import { CharacterTile } from "./CharacterTile";
import { DirectionInput } from "./DirectionInput";
import type { usePuzzle } from "../usePuzzleState";
import { useRotate } from "./useRotate";

export interface PuzzleProps {
  puzzleID: string;
  state: ReturnType<typeof usePuzzle>;
}

export const Puzzle: React.FC<PuzzleProps> = ({ puzzleID, state }) => {
  const grid = useCompositeState();
  const rotate = useRotate(puzzleID, state);
  const repeat = range(state.initial.width);

  return (
    <Container state={grid}>
      <Grid>
        <Row>
          {repeat.map((y) => (
            <DirectionInput
              key={`up-${y}`}
              rowOrCol={y}
              dir="up"
              disabled={state.win}
              rotate={rotate}
            />
          ))}
        </Row>
        {state.current.matrix.map((row, x) => {
          const word = row.join(``);
          return (
            <Row key={`row-${x}`}>
              <DirectionInput
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
                  <CharacterTile
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
              <DirectionInput
                key={`right-${x}`}
                rowOrCol={x}
                dir="right"
                disabled={state.win}
                rotate={rotate}
              />
            </Row>
          );
        })}
        <Row>
          {repeat.map((y) => (
            <DirectionInput
              key={`down-${y}`}
              rowOrCol={y}
              dir="down"
              disabled={state.win}
              rotate={rotate}
            />
          ))}
        </Row>
      </Grid>
    </Container>
  );
};
