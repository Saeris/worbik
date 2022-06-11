/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import type { InferGetStaticPropsType, NextPage } from "next";
import { MdOutlineInfo } from "react-icons/md";
import { DialogDismiss, DialogHeading } from "ariakit";
import type { getStaticProps } from "./getStaticProps";
import { Puzzle } from "./Puzzle/Puzzle";
import { Main, ModalHeader, Title } from "./elements";
import { Modal } from "../../components/Modal";
import { parseChallenge } from "../../utils/parseChallenge";

const numbers = {
  5: `five`,
  6: `six`,
  7: `seven`,
  8: `eight`
};

export const Game: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  challenge
}) => {
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState(false);
  const { moves: target, length, words } = parseChallenge(challenge);

  const handleMove = useCallback((): void => {
    setMoves((x) => x + 1);
  }, []);

  const handleWin = useCallback((): void => {
    setWinner(true);
  }, []);

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
            {`Hidden in this puzzle are ${numbers[words]} words that are each
        ${numbers[length]} letters long. Use the buttons around the edges to
        rotate the columns and rows in order to find the correct position of
        each letter. Get all of the letters in the correct position to win!`}
          </p>
        </Modal>
      </Title>

      <Puzzle
        initial={challenge}
        onMove={handleMove}
        onWin={handleWin}
        winner={winner}
      />
      {winner
        ? `${
            moves === target
              ? ` Wow! You won in only ${moves} moves! You're a wizard at this!`
              : `Congratulations, you won in ${moves} moves! Can you do better?`
          }`
        : `Moves: ${moves}`}
    </Main>
  );
};
