import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore
} from "react";
import { fetch } from "void/client";
import { useQueuedAPICall } from "#hooks";
import { Grid, PuzzleState, type PuzzleStateInit } from "#state";
import { filterExpiredDates } from "#utils";
import { getProgress } from "#utils/progress";
import { getGameKey, getPuzzleOfKey } from "#utils/solves";
import { usePlayer } from "./usePlayer";

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
  /** Picks up a saved game, in place of whatever is on the board */
  resume: (saved: string | null) => void;
} => {
  // Each player has a game of their own, so a change of player is a change of game
  const key = getGameKey(puzzleID, usePlayer()?.did);
  // oxlint-disable-next-line react/exhaustive-deps -- a new player gets a new game, and `key` is how that's known
  const state = useMemo(() => new PuzzleState(init), [init, key]);
  const moves = useMoves(state);
  const win = useWin(state);

  // The server's note of where the game is, without which it won't check the next move
  const position = useRef<string | undefined>(undefined);

  useHints(state);

  const resume = useCallback(
    (saved: string | null) => {
      const [, history, , , from] = saved?.split(`|`) ?? [];
      const progress = getProgress(saved);

      // A saved game is only of this puzzle if it began where this puzzle does. One that didn't is of a puzzle that has since been remade, which happens in development.
      if (history?.split(`,`)[0] !== state.initial.toString().toLowerCase()) {
        return;
      }

      // A game that was left unfinished before the server began keeping track of moves can't be carried on from
      if (progress && !progress.solved && !from) return;

      position.current = from;
      state.restore(saved?.split(`|`) as PuzzleState["snapshot"]);
    },
    [state]
  );

  useEffect(() => {
    if (!persist) return;

    position.current = undefined;
    resume(localStorage.getItem(key));

    // purge puzzles older than yesterday, utc-0 + 32hrs
    Object.keys(localStorage).forEach((stored) => {
      if (filterExpiredDates(getPuzzleOfKey(stored))) {
        localStorage.removeItem(stored);
      }
    });
  }, [key, persist, resume]);

  const queue = useQueuedAPICall(
    useCallback(
      async (vals: string[]): Promise<void> => {
        const { hints, from } = await fetch(`/api/check`, {
          query: {
            puzzle: puzzleID,
            guesses: vals.join(`,`),
            ...(position.current && { from: position.current })
          }
        });

        position.current = from;

        const [width, history, hint, reported = ``] =
          state.validate(hints).snapshot;

        if (persist) {
          localStorage.setItem(
            key,
            [width, history, hint, reported, from].join(`|`)
          );
        }
      },
      [puzzleID, key, state, persist]
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
    resume,
    target: state.target,
    history: state.history,
    getHintAt: state.getHintAt,
    isRowCorrect: state.isRowCorrect
  };
};
