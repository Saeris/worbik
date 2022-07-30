/* eslint-disable react/no-array-index-key */
import React, { useState, useCallback } from "react";
import type { NextPage } from "next";
import { Puzzle } from "./Puzzle/Puzzle";
import { Main, Title } from "./elements";
import { usePuzzle } from "./usePuzzleState";
import { Guide } from "./Guide";

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
        <Guide width={state.initial.width} height={state.initial.height} />
      </Title>
      <Puzzle state={state} onWin={handleWin} winner={winner} />
      {winner ? <p>{winMessage()}</p> : <p>{`Moves: ${moves}`}</p>}
    </Main>
  );
};
