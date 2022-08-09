import React from "react";
import type { NextPage } from "next";
import { Puzzle } from "./Puzzle/Puzzle";
import { Main, Title } from "./elements";
import { usePuzzle } from "./usePuzzleState";
import { Guide } from "./Guide";
import { Settings } from "./Settings";

export interface GameProps {
  puzzleID: string;
  challenge: string;
}

export const Game: NextPage<GameProps> = ({ puzzleID, challenge }) => {
  const state = usePuzzle(puzzleID, challenge);

  const winMessage = (): string =>
    state.moves <= state.target
      ? ` Wow! You won in only ${state.moves} moves! You're a wizard at this!`
      : `Congratulations, you won in ${state.moves} moves! Can you do better?`;

  return (
    <Main>
      <Title>
        Worbik
        <Guide width={state.initial.width} height={state.initial.height} />
      </Title>
      <Settings initial={state.config} />
      <Puzzle puzzleID={puzzleID} state={state} />
      {state.win ? <p>{winMessage()}</p> : <p>{`Moves: ${state.moves}`}</p>}
    </Main>
  );
};
