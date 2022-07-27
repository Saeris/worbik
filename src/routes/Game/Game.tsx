/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import type { NextPage } from "next";
import { MdOutlineInfo } from "react-icons/md";
import { DialogDismiss, DialogHeading } from "ariakit/dialog";
import { Puzzle } from "./Puzzle/Puzzle";
import { Main, ModalHeader, Title } from "./elements";
import { Modal } from "../../components/Modal";
import { Character, Hint, Row } from "./Puzzle/elements";
import { usePuzzle } from "./usePuzzleState";

const numbers = {
  5: `five`,
  6: `six`,
  7: `seven`,
  8: `eight`
};

export interface GameProps {
  challenge: string;
}

export const Game: NextPage<GameProps> = ({ challenge }) => {
  const [winner, setWinner] = useState(false);
  const state = usePuzzle(challenge);
  const moves = state.moves;

  const handleWin = useCallback((): void => {
    setWinner(true);
  }, []);

  const winMessage = (): string =>
    moves <= state.target
      ? ` Wow! You won in only ${moves} moves! You're a wizard at this!`
      : `Congratulations, you won in ${moves} moves! Can you do better?`;

  return (
    <Main>
      <Title>
        Worbik
        <Modal label={<MdOutlineInfo />} aria-label={`How to Play`}>
          <ModalHeader>
            <DialogHeading>How To Play:</DialogHeading>
            <DialogDismiss />
          </ModalHeader>
          <p>
            {`Hidden in this puzzle are ${
              numbers[state.initial.height]
            } words that are each
        ${
          numbers[state.initial.width]
        } letters long. Use the buttons around the edges to
        rotate the columns and rows in order to find the correct position of
        each letter.`}
          </p>
          <Row>
            <Character $hint disabled>
              {`W`}
              <Hint>{`W`}</Hint>
            </Character>
          </Row>
          <p>{`As you play, letters in the correct position will turn their tile yellow and will permanently display a reminder in the bottom right corner.`}</p>
          <Row>
            <Character $correct disabled>
              {`W`}
              <Hint>{`W`}</Hint>
            </Character>
            <Character $correct disabled>
              {`O`}
              <Hint>{`O`}</Hint>
            </Character>
            <Character $correct disabled>
              {`R`}
              <Hint>{`R`}</Hint>
            </Character>
            <Character $correct disabled>
              {`B`}
              <Hint>{`B`}</Hint>
            </Character>
            <Character $correct disabled>
              {`I`}
              <Hint>{`I`}</Hint>
            </Character>
            <Character $correct disabled>
              {`K`}
              <Hint>{`K`}</Hint>
            </Character>
          </Row>
          <p>{`When you complete a row, all of the tiles will turn green. Get all of the letters in the correct position to win!`}</p>
        </Modal>
      </Title>

      <Puzzle state={state} onWin={handleWin} winner={winner} />
      {winner ? <p>{winMessage()}</p> : <p>{`Moves: ${moves}`}</p>}
    </Main>
  );
};
