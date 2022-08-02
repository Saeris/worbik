/* eslint-disable react/no-array-index-key */
import React, { useCallback } from "react";
import { useCompositeState } from "ariakit/composite/composite-state";
import { Direction } from "../../../components/Direction";
import { range } from "../../../utils";
import { Container, Grid, Row, Character, Hint } from "./elements";
import type { usePuzzle } from "../usePuzzleState";

export interface PuzzleProps {
  puzzleID: string;
  state: ReturnType<typeof usePuzzle>;
}

export const Puzzle: React.FC<PuzzleProps> = ({ puzzleID, state }) => {
  const grid = useCompositeState();
  const winner = state.win;
  const repeat = range(state.initial.width);

  const rotate = useCallback(
    (rowOrCol: number, dir: `up` | `down` | `left` | `right`) => {
      if (!state.win) {
        const check = async (next: string): Promise<void> => {
          const url = new URL(`/api/check`, window.location.origin);
          url.searchParams.set(`puzzle`, puzzleID);
          url.searchParams.set(`guess`, next);
          state.validate(await (await fetch(url.href)).json());
        };
        void check(state.getNextState(rowOrCol, dir).toString());
      }
    },
    [puzzleID, state]
  );

  const handleClick = useCallback(
    (
        rowOrCol: number,
        dir: `up` | `down` | `left` | `right`
      ): React.MouseEventHandler<HTMLButtonElement> =>
      (e) => {
        e.preventDefault();
        rotate(rowOrCol, dir);
      },
    [rotate]
  );

  const handleKeypress = useCallback(
    (x: number, y: number): React.KeyboardEventHandler<HTMLButtonElement> =>
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
    [rotate]
  );

  return (
    <Container state={grid}>
      <Grid>
        <Row>
          {repeat.map((y) => (
            <Direction
              key={`up-${y}`}
              direction="up"
              onClick={handleClick(y, `up`)}
              aria-label={`Rotate column ${y + 1} up`}
              disabled={winner}
            />
          ))}
        </Row>
        {state.current.matrix.map((row, x) => {
          const word = row.join(``);
          return (
            <Row key={`row-${x}`}>
              <Direction
                key={`left-${x}`}
                direction="left"
                onClick={handleClick(x, `left`)}
                aria-label={`Rotate row ${x + 1} left`}
                disabled={winner}
              />
              {row.map((char, y) => {
                const hint = state.hints[x][y];
                const correct = word.toUpperCase() === state.hints[x].join(``);
                return (
                  <Character
                    key={`char-${x}${y}`}
                    $hint={char.toUpperCase() === hint}
                    $correct={correct}
                    onKeyDown={handleKeypress(x, y)}
                    aria-label={`Grid tile ${x + 1}, ${
                      y + 1
                    }. Current character is ${char}.${
                      hint === ` `
                        ? ``
                        : ` Correct character for this tile is ${hint}.`
                    }`}
                    disabled={winner}
                  >
                    {char.toUpperCase()}
                    <Hint>{hint}</Hint>
                  </Character>
                );
              })}
              <Direction
                key={`right-${x}`}
                direction="right"
                onClick={handleClick(x, `right`)}
                aria-label={`Rotate row ${x + 1} right`}
                disabled={winner}
              />
            </Row>
          );
        })}
        <Row>
          {repeat.map((y) => (
            <Direction
              key={`down-${y}`}
              direction="down"
              onClick={handleClick(y, `down`)}
              aria-label={`Rotate column ${y + 1} down`}
              disabled={winner}
            />
          ))}
        </Row>
      </Grid>
    </Container>
  );
};
