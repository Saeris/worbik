import { useCallback, useMemo, useSyncExternalStore } from "react";
import { Grid, PuzzleState } from "../../utils";

const useMatrix = (state: PuzzleState): string =>
  useSyncExternalStore(
    state.subscribe,
    useCallback(() => state.current.toString(), [state]),
    useCallback(() => state.current.toString(), [state])
  );

const useHints = (state: PuzzleState): PuzzleState["hints"] =>
  useSyncExternalStore(
    state.subscribe,
    useCallback(() => state.hints, [state]),
    useCallback(() => state.hints, [state])
  );

const useHistory = (state: PuzzleState): PuzzleState["history"] =>
  useSyncExternalStore(
    state.subscribe,
    useCallback(() => state.history, [state]),
    useCallback(() => state.history, [state])
  );

const useMoves = (state: PuzzleState): PuzzleState["moves"] =>
  useSyncExternalStore(
    state.subscribe,
    useCallback(() => state.moves, [state]),
    useCallback(() => state.moves, [state])
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
  width: Grid["width"];
  height: Grid["height"];
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
    width: state.current.width,
    height: state.current.height,
    target: state.target,
    getNextState: state.getNextState,
    cacheHints: state.cacheHints,
    toString: state.toString
  };
};
