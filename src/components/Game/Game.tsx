import { useCallback, useState } from "react";
import { cx } from "class-variance-authority";
import type { PuzzleStateInit } from "#state";
import { usePuzzle, useScore } from "#hooks";
import { Puzzle } from "./Puzzle";
import { Leaderboard } from "../Leaderboard";
import { Menu } from "../Menu";
import { Result } from "../Result";
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
  const score = useScore(puzzleID, state.win, state.history);
  const { width, height } = state.initial;
  // The leaderboard is only loaded once it's asked for, so it has to be told when that is
  const [ranking, setRanking] = useState(false);

  const showRanking = useCallback(() => {
    setRanking(true);
  }, []);

  const hideRanking = useCallback(() => {
    setRanking(false);
  }, []);

  return (
    <main className={cx(styles.main, state.win && styles.solved)}>
      <h1 className={styles.mark}>Worbik</h1>
      <SizePicker
        className={styles.size}
        puzzleID={puzzleID}
        width={width}
        height={height}
      />
      <Menu
        className={styles.menu}
        width={width}
        height={height}
        onLeaderboard={showRanking}
      />
      {state.win ? (
        <Result
          className={styles.result}
          width={width}
          height={height}
          moves={state.moves}
          target={state.target}
          status={score.status}
          scores={score.scores}
          retry={score.retry}
          onLeaderboard={showRanking}
        />
      ) : (
        <p className={styles.status}>
          <strong>{state.moves}</strong>
          {state.moves === 1 ? ` move` : ` moves`}
        </p>
      )}
      <Puzzle className={styles.board} state={state} />
      <SignIn title={state.win ? `Post your score` : `Sign in`} />
      <Leaderboard
        open={ranking}
        onClose={hideRanking}
        puzzleID={puzzleID}
        width={width}
        height={height}
      />
    </main>
  );
};
