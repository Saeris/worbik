/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import { useCompositeState } from "ariakit";
import { Direction } from "../../../components/Direction";
import { deserialize, range, getNextState } from "../../../utils";
import type { Matrix2D } from "../../../utils/types";
import { Container, Grid, Row, Character } from "./elements";

export interface PuzzleProps {
  initial: Matrix2D<string>;
  onMove?: () => void;
  onWin?: () => void;
  winner?: boolean;
}

export const Puzzle: React.FC<PuzzleProps> = ({
  initial,
  onMove = (): void => {},
  onWin = (): void => {},
  winner = false
}) => {
  const state = useCompositeState();
  const [matrix, setMatrix] = useState(initial);
  const repeat = range(matrix.length);

  const rotate = useCallback(
    (
      // row or col number
      pos: number,
      // true = increment, false = decriment
      dir: boolean = false,
      // true = horizontal, false = vertical
      axis: boolean = false
    ) => {
      if (!winner) {
        const check = async (): Promise<void> => {
          const url = new URL(`/api/check`, window.location.origin);
          url.searchParams.set(
            `solution`,
            getNextState(matrix, pos, dir, axis).flat().join(``)
          );
          const res = await (await fetch(url.toString())).json();
          // We'll update the game state with the response we got
          // from our server
          const nextState = deserialize(res);
          const stateStr = nextState.flat().join(``);
          setMatrix(nextState);
          onMove();
          if (stateStr === stateStr.toUpperCase()) {
            onWin();
          }
        };
        void check();
      }
    },
    [winner, matrix, onMove, onWin]
  );

  const handleClick = useCallback(
    (
        pos: number,
        dir: boolean = false,
        axis: boolean = false
      ): React.MouseEventHandler<HTMLButtonElement> =>
      (e) => {
        e.preventDefault();
        rotate(pos, dir, axis);
      },
    [rotate]
  );

  const handleKeypress = useCallback(
    (x: number, y: number): React.KeyboardEventHandler<HTMLButtonElement> =>
      (e) => {
        const key = e.key;
        if ([`w`, `a`, `s`, `d`].includes(key)) {
          // w | d = increment, a | s = decriment
          const dir = [`w`, `d`].includes(key);
          // a | d = horizontal, w | s = veritcal
          const axis = [`a`, `d`].includes(key);
          rotate(axis ? x : y, dir, axis);
        }
      },
    [rotate]
  );

  return (
    <Container state={state}>
      <Grid>
        <Row>
          {repeat.map((i) => (
            <Direction
              key={`up-${i}`}
              direction="up"
              onClick={handleClick(i, true)}
            />
          ))}
        </Row>
        {matrix.map((row, x) => {
          const word = row.join(``);
          return (
            <Row key={`row-${x}`}>
              <Direction
                key={`left-${x}`}
                direction="left"
                onClick={handleClick(x, false, true)}
              />
              {row.map((char, y) => (
                <Character
                  key={`char-${x}${y}`}
                  $hint={/^[A-Z]*$/.test(char)}
                  $correct={/^[A-Z]*$/.test(word)}
                  onKeyDown={handleKeypress(x, y)}
                >
                  {char.toUpperCase()}
                </Character>
              ))}
              <Direction
                key={`right-${x}`}
                direction="right"
                onClick={handleClick(x, true, true)}
              />
            </Row>
          );
        })}
        <Row>
          {repeat.map((i) => (
            <Direction
              key={`down-${i}`}
              direction="down"
              onClick={handleClick(i)}
            />
          ))}
        </Row>
      </Grid>
    </Container>
  );
};
