import type { PuzzleStateInit } from "#state";
import { usePuzzle } from "#hooks";
import { Puzzle } from "./Puzzle";
import { Guide } from "../Guide";
import { Config } from "../Config";
import styles from "./Game.module.css";

export interface GameProps {
  puzzleID: string;
  init: PuzzleStateInit;
  persist?: boolean;
}

export const Game: React.FC<GameProps> = ({ puzzleID, init, persist }) => {
  const state = usePuzzle(puzzleID, init, persist);

  const winMessage = (): string =>
    state.moves <= state.target
      ? ` Wow! You won in only ${state.moves} moves! You're a wizard at this!`
      : `Congratulations, you won in ${state.moves} moves! Can you do better?`;

  return (
    <main className={styles.main}>
      <header className={styles.title}>
        <h1>Worbik</h1>
        <Config />
        <Guide width={state.initial.width} height={state.initial.height} />
      </header>
      <Puzzle state={state} />
      {state.win ? <p>{winMessage()}</p> : <p>{`Moves: ${state.moves}`}</p>}
    </main>
  );
};
