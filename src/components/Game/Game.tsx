import type { PuzzleStateInit } from "#state";
import { usePuzzle } from "#hooks";
import { Puzzle } from "./Puzzle";
import { Menu } from "../Menu";
import { SignIn } from "../SignIn";
import { SizePicker } from "../SizePicker";
import styles from "./Game.module.css";

export interface GameProps {
  puzzleID: string;
  init: PuzzleStateInit;
  persist?: boolean;
}

export const Game: React.FC<GameProps> = ({ puzzleID, init, persist }) => {
  const state = usePuzzle(puzzleID, init, persist);
  const { width, height } = state.initial;
  const moves = state.moves === 1 ? `move` : `moves`;

  return (
    <main className={styles.main}>
      <h1 className={styles.mark}>Worbik</h1>
      <SizePicker className={styles.size} width={width} height={height} />
      <Menu className={styles.menu} width={width} height={height} />
      {/* The target is only revealed by a win: seeing it while playing discourages those who are behind it */}
      {state.win ? (
        <p className={styles.result}>
          <strong>{`Solved in ${state.moves} ${moves}`}</strong>
          {`The target was ${state.target}.`}
        </p>
      ) : (
        <p className={styles.status}>
          <strong>{state.moves}</strong>
          {` ${moves}`}
        </p>
      )}
      <Puzzle className={styles.board} state={state} />
      <SignIn />
    </main>
  );
};
