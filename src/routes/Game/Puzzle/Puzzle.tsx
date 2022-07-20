/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import { useCompositeState } from "ariakit/composite/composite-state";
import { Direction } from "../../../components/Direction";
import type { Matrix2D } from "../../../utils";
import {
  range,
  getNextState,
  group,
  cacheHints,
  parseChallenge,
  parseSolution
} from "../../../utils";
import { Container, Grid, Row, Character, Hint } from "./elements";

export interface PuzzleProps {
  initialChallenge: string;
  initialHints: Matrix2D<string>;
  onMove?: () => void;
  onWin?: () => void;
  winner?: boolean;
}

export const Puzzle: React.FC<PuzzleProps> = ({
  initialChallenge,
  initialHints,
  onMove = (): void => {},
  onWin = (): void => {},
  winner = false
}) => {
  const state = useCompositeState();
  const [guess, setGuess] = useState(initialChallenge);
  const [hints, setHints] = useState(initialHints);
  const { challenge, length, moves } = parseChallenge(guess);
  const repeat = range(length);

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
            `guess`,
            `${length}${getNextState(challenge, pos, dir, axis)
              .flat()
              .join(``)}`
          );
          url.searchParams.set(`challenge`, initialChallenge);
          const res: string = await (await fetch(url.href)).json();
          // We'll update the game state with the response we got
          // from our server
          const { solution } = parseSolution(res);
          const next = solution.flat().join(``);
          setGuess(`${length}${next}${moves}`);
          setHints((prev) =>
            group(cacheHints(prev.flat().join(``), next), length)
          );
          onMove();
          if (next === next.toUpperCase()) {
            onWin();
          }
        };
        void check();
      }
    },
    [initialChallenge, winner, challenge, length, moves, onMove, onWin]
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
              aria-label={`Rotate column ${i + 1} up`}
            />
          ))}
        </Row>
        {challenge.map((row, x) => {
          const word = row.join(``);
          return (
            <Row key={`row-${x}`}>
              <Direction
                key={`left-${x}`}
                direction="left"
                onClick={handleClick(x, false, true)}
                aria-label={`Rotate row ${x + 1} left`}
              />
              {row.map((char, y) => {
                const hint = hints[x][y].toUpperCase();
                return (
                  <Character
                    key={`char-${x}${y}-${char}`}
                    $hint={/^[A-Z]*$/.test(char)}
                    $correct={/^[A-Z]*$/.test(word)}
                    onKeyDown={handleKeypress(x, y)}
                    aria-label={`Grid tile ${x + 1}, ${
                      y + 1
                    }. Current character is ${char}.${
                      hint === ` `
                        ? ``
                        : ` Correct character for this tile is ${hint}.`
                    }`}
                  >
                    {char.toUpperCase()}
                    <Hint>{hint}</Hint>
                  </Character>
                );
              })}
              <Direction
                key={`right-${x}`}
                direction="right"
                onClick={handleClick(x, true, true)}
                aria-label={`Rotate row ${x + 1} right`}
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
              aria-label={`Rotate column ${i + 1} down`}
            />
          ))}
        </Row>
      </Grid>
    </Container>
  );
};
