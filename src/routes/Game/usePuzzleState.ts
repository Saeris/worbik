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

export const usePuzzle = (
  init: string
): {
  initial: PuzzleState["initial"];
  current: Grid;
  hints: ReturnType<typeof useHints>;
  history: ReturnType<typeof useHistory>;
  moves: ReturnType<typeof useMoves>;
  target: PuzzleState["target"];
  getNextState: PuzzleState["getNextState"];
  cacheHints: PuzzleState["cacheHints"];
  toString: PuzzleState["toString"];
} => {
  const state = useMemo(() => new PuzzleState(init), [init]);
  const current = Grid.fromString(useMatrix(state));
  const hints = useHints(state);
  const history = useHistory(state);
  const moves = useMoves(state);

  return {
    initial: state.initial,
    current,
    hints,
    history,
    moves,
    target: state.target,
    getNextState: state.getNextState,
    cacheHints: state.cacheHints,
    toString: state.toString
  };
};
