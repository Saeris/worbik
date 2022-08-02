import { useMemo, useSyncExternalStore } from "react";
import { Grid, PuzzleState } from "../../utils";

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

export const usePuzzle = (
  init: string
): {
  initial: Grid;
  current: Grid;
  hints: PuzzleState["hints"];
  history: PuzzleState["history"];
  moves: PuzzleState["moves"];
  win: PuzzleState["win"];
  target: PuzzleState["target"];
  getNextState: PuzzleState["getNextState"];
  validate: PuzzleState["validate"];
  toString: PuzzleState["toString"];
} => {
  const state = useMemo(() => new PuzzleState(init), [init]);
  const current = Grid.fromString(useMatrix(state));
  const hints = useHints(state);
  const history = useHistory(state);
  const moves = useMoves(state);
  const win = useWin(state);

  return {
    initial: state.initial,
    current,
    hints,
    history,
    moves,
    win,
    target: state.target,
    getNextState: state.getNextState,
    validate: state.validate,
    toString: state.toString
  };
};
