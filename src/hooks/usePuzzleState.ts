import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore
} from "react";
import {
  Grid,
  PuzzleState,
  filterExpiredDates,
  type PuzzleStateInit
} from "#utils";
import { useQueuedAPICall } from "#hooks";

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
  "getHintAt" | "isRowCorrect" | "moves" | "target" | "win"
> & {
  initial: Grid;
  current: Grid;
  rotate: (rowOrCol: number, dir: `down` | `left` | `right` | `up`) => void;
} => {
  const [restore, setRestore] = useState(persist);
  const state = useMemo(() => new PuzzleState(init), [init]);
  const url = useMemo(() => {
    const endpoint = new URL(`/api/check`, window.location.origin);
    endpoint.searchParams.set(`puzzle`, puzzleID);
    return endpoint;
  }, [puzzleID]);
  const moves = useMoves(state);
  const win = useWin(state);

  useEffect(() => {
    if (typeof window !== `undefined` && restore) {
      const previousSession = localStorage.getItem(puzzleID);
      if (previousSession) {
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
        url.searchParams.set(`guesses`, vals.join(`,`));
        const snapshot = state
          .validate((await (await fetch(url.href)).json()) as string[])
          .snapshot.join(`|`);

        if (persist) {
          localStorage.setItem(puzzleID, snapshot);
        }
      },
      [puzzleID, state, url, persist]
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
    getHintAt: state.getHintAt,
    isRowCorrect: state.isRowCorrect
  };
};
