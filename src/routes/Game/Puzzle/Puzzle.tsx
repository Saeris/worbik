/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import { useCompositeState } from "ariakit/composite/composite-state";
import { Direction } from "../../../components/Direction";
import { range, getNextState } from "../../../utils";
import { Container, Grid, Row, Character } from "./elements";
import { parseChallenge } from "../../../utils/parseChallenge";
import { parseSolution } from "../../../utils/parseSolution";

export interface PuzzleProps {
  initial: string;
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
  const [guess, setGuess] = useState(initial);
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
          url.searchParams.set(`challenge`, initial);
          const res: string = await (await fetch(url.href)).text();
          // We'll update the game state with the response we got
          // from our server
          const { solution } = parseSolution(res);
          const stateStr = solution.flat().join(``);
          setGuess(`${length}${stateStr}${moves}`);
          onMove();
          if (stateStr === stateStr.toUpperCase()) {
            onWin();
          }
        };
        void check();
      }
    },
    [initial, winner, challenge, length, moves, onMove, onWin]
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
              {row.map((char, y) => (
                <Character
                  key={`char-${x}${y}`}
                  $hint={/^[A-Z]*$/.test(char)}
                  $correct={/^[A-Z]*$/.test(word)}
                  onKeyDown={handleKeypress(x, y)}
                  aria-label={`Grid square ${x + 1}, ${
                    y + 1
                  }. Current character is ${char}`}
                >
                  {char.toUpperCase()}
                </Character>
              ))}
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
