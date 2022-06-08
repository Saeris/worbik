/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import type { InferGetStaticPropsType, NextPage } from "next";
import { MdOutlineInfo } from "react-icons/md";
import { DialogDismiss, DialogHeading } from "ariakit";
import type { getStaticProps } from "./getStaticProps";
import { Puzzle } from "./Puzzle/Puzzle";
import { Main, ModalHeader, Title } from "./elements";
import { Modal } from "../../components/Modal";

const numbers = {
  5: `five`,
  6: `six`,
  7: `seven`,
  8: `eight`
};

export const Game: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  initial,
  target
}) => {
  const [moves, setMoves] = useState(0);
  const [winner, setWinner] = useState(false);

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
        <Modal label={<MdOutlineInfo />}>
          <ModalHeader>
            <DialogHeading>How To Play:</DialogHeading>
            <DialogDismiss />
          </ModalHeader>
          <p>
            {`Hidden in this puzzle are ${
              numbers[initial[0].length]
            } words that are each
        ${
          numbers[initial[1].length]
        } letters long. Use the buttons around the edges to
        rotate the columns and rows in order to find the correct position of
        each letter. Get all of the letters in the correct position to win!`}
          </p>
        </Modal>
      </Title>

      <Puzzle
        initial={initial}
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
