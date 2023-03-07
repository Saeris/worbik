import React from "react";
import type { NextPage } from "next/types";
import { Puzzle } from "./Puzzle/Puzzle";
import { Main, Title } from "./elements";
import { usePuzzle } from "./usePuzzleState";
import { Guide } from "./Guide";
import { Config } from "./Config";
import type { PuzzleStateInit } from "../../utils";

export interface GameProps {
  puzzleID: string;
  init: PuzzleStateInit;
}

export const Game: NextPage<GameProps> = ({ puzzleID, init }) => {
  const state = usePuzzle(puzzleID, init);

  const winMessage = (): string =>
    state.moves <= state.target
      ? ` Wow! You won in only ${state.moves} moves! You're a wizard at this!`
      : `Congratulations, you won in ${state.moves} moves! Can you do better?`;

  return (
    <Main>
      <Title>
        Worbik
        <Config />
        <Guide width={state.initial.width} height={state.initial.height} />
      </Title>
      <Puzzle puzzleID={puzzleID} state={state} />
      {state.win ? <p>{winMessage()}</p> : <p>{`Moves: ${state.moves}`}</p>}
    </Main>
  );
};
