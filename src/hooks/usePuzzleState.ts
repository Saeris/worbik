import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from "react";
import { fetch } from "void/client";
import { useQueuedAPICall } from "#hooks";
import { Grid, PuzzleState, type PuzzleStateInit } from "#state";
import { filterExpiredDates } from "#utils";

const useMatrix = (state: PuzzleState): string =>
  useSyncExternalStore(
    state.subscribe,
    () => state.current.toString(),
    () => state.current.toString()
  );

const useMoves = (state: PuzzleState): PuzzleState["moves"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.moves,
    () => state.moves
  );

/**
 * Hints are revealed by the server some time after the move that earned
 * them, at which point nothing else about the puzzle changes. They need a
 * subscription of their own, or else they won't appear until the next move.
 */
const useHints = (state: PuzzleState): string =>
  useSyncExternalStore(
    state.subscribe,
    () => state.hints.flat().join(``),
    () => state.hints.flat().join(``)
  );

const useWin = (state: PuzzleState): PuzzleState["win"] =>
  useSyncExternalStore(
    state.subscribe,
    () => state.win,
    () => state.win
  );

export const usePuzzle = (
  puzzleID: string,
  init: PuzzleStateInit,
  persist: boolean = true
): Pick<
  PuzzleState,
  "getHintAt" | "history" | "isRowCorrect" | "moves" | "target" | "win"
> & {
  initial: Grid;
  current: Grid;
  rotate: (rowOrCol: number, dir: `down` | `left` | `right` | `up`) => void;
} => {
  const [restore, setRestore] = useState(persist);
  const state = useMemo(() => new PuzzleState(init), [init]);
  const moves = useMoves(state);
  const win = useWin(state);

  useHints(state);

  useEffect(() => {
    if (typeof window !== `undefined` && restore) {
      const previousSession = localStorage.getItem(puzzleID);
      // A saved game is only of this puzzle if it began where this puzzle does. One that didn't is of a puzzle that has since been remade, which happens in development.
      if (
        previousSession?.split(`|`)[1]?.split(`,`)[0] ===
        state.initial.toString().toLowerCase()
      ) {
        state.restore(previousSession.split(`|`) as PuzzleState["snapshot"]);
      }
      // purge puzzles older than yesterday, utc-0 + 32hrs
      Object.keys(localStorage).forEach((key) => {
        if (filterExpiredDates(key)) {
          localStorage.removeItem(key);
        }
      });

      setRestore(false);
    }
  }, [puzzleID, state, restore]);

  const queue = useQueuedAPICall(
    useCallback(
      async (vals: string[]): Promise<void> => {
        const snapshot = state
          .validate(
            await fetch(`/api/check`, {
              query: { puzzle: puzzleID, guesses: vals.join(`,`) }
            })
          )
          .snapshot.join(`|`);

        if (persist) {
          localStorage.setItem(puzzleID, snapshot);
        }
      },
      [puzzleID, state, persist]
    )
  );

  const rotate = useCallback(
    (rowOrCol: number, dir: `down` | `left` | `right` | `up`) => {
      if (!win) {
        queue(state.getNextState(rowOrCol, dir).toString());
      }
    },
    [queue, state, win]
  );

  return {
    initial: state.initial,
    current: new Grid(useMatrix(state), init[0]),
    moves,
    win,
    rotate,
    target: state.target,
    history: state.history,
    getHintAt: state.getHintAt,
    isRowCorrect: state.isRowCorrect
  };
};
