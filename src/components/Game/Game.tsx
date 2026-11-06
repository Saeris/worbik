import { useCallback, useState } from "react";
import { cx } from "class-variance-authority";
import type { PuzzleStateInit } from "#state";
import { usePuzzle, useScore } from "#hooks";
import { Puzzle } from "./Puzzle";
import { Drawer, type View } from "../Drawer";
import { Menu } from "../Menu";
import { Result } from "../Result";
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
  // What the drawer is showing over the game, if it's open. The game stays as it is underneath.
  const [view, setView] = useState<View | null>(null);

  const showLeaderboard = useCallback(() => {
    setView(`leaderboard`);
  }, []);

  const showSignIn = useCallback(() => {
    setView(`sign-in`);
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
      <Menu className={styles.menu} open={view !== null} onOpen={setView} />
      {state.win ? (
        <Result
          className={styles.result}
          puzzleID={puzzleID}
          width={width}
          height={height}
          moves={state.moves}
          target={state.target}
          status={score.status}
          scores={score.scores}
          retry={score.retry}
          onLeaderboard={showLeaderboard}
          onSignIn={showSignIn}
        />
      ) : (
        <p className={styles.status}>
          <strong>{state.moves}</strong>
          {state.moves === 1 ? ` move` : ` moves`}
        </p>
      )}
      <Puzzle className={styles.board} state={state} />
      <Drawer
        view={view}
        onView={setView}
        puzzleID={puzzleID}
        width={width}
        height={height}
        solved={state.win}
      />
    </main>
  );
};
