import { useEffect, useMemo, useSyncExternalStore } from "react";
import { Grid, PuzzleState } from "../../utils";
import { filterExpiredDates } from "../../utils/getDateKey";

const useMatrix = (state: PuzzleState): string =>
  useSyncExternalStore(
    state.subscribe,
    () => state.current.toString(),
    () => state.current.toString()
  );

const useHints = (state: PuzzleState): PuzzleState["hints"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.hints,
    () => state.hints
  );

const useHistory = (state: PuzzleState): PuzzleState["history"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.history,
    () => state.history
  );

const useMoves = (state: PuzzleState): PuzzleState["moves"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.moves,
    () => state.moves
  );

const useWin = (state: PuzzleState): PuzzleState["win"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.win,
    () => state.win
  );

const useSnapshot = (state: PuzzleState): PuzzleState["snapshot"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.snapshot,
    () => state.snapshot
  );

export const usePuzzle = (
  puzzleID: string,
  init: string
): Pick<
  PuzzleState,
  | "hints"
  | "config"
  | "history"
  | "moves"
  | "win"
  | "snapshot"
  | "target"
  | "getNextState"
  | "validate"
  | "toString"
> & {
  initial: Grid;
  current: Grid;
} => {
  const state = useMemo(() => new PuzzleState(init), [init]);
  const current = Grid.fromString(useMatrix(state));
  const hints = useHints(state);
  const history = useHistory(state);
  const moves = useMoves(state);
  const win = useWin(state);
  const snapshot = useSnapshot(state);

  useEffect(() => {
    if (typeof window !== `undefined`) {
      const previousSession = localStorage.getItem(puzzleID);
      if (previousSession) {
        state.restore(previousSession);
      }
      // purge puzzles older than yesterday, utc-0 + 32hrs
      Object.keys(localStorage).forEach((key) => {
        if (filterExpiredDates(key)) {
          localStorage.removeItem(key);
        }
      });
    }
  }, [puzzleID, state]);

  return {
    initial: state.initial,
    current,
    config: state.config,
    hints,
    history,
    moves,
    win,
    snapshot,
    target: state.target,
    getNextState: state.getNextState,
    validate: state.validate,
    toString: state.toString
  };
};
