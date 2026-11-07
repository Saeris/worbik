import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { fetch, FetchError } from "void/client";
import { Grid, MAX_GUESSES, PuzzleState, type PuzzleStateInit } from "#state";
import { filterExpiredDates } from "#utils";
import { readSavedGame } from "#utils/progress";
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

/**
 * A game, and how far the server has got with checking it.
 *
 * What's left to check is always worked out from the game's own moves, so
 * nothing can be sent twice, or be sent as part of any other game.
 */
interface Game {
  /** Where the game is saved, which is what tells one player's game from another's */
  readonly key: string;
  readonly init: PuzzleStateInit;
  readonly state: PuzzleState;
  /** How many of the game's moves have been checked */
  checked: number;
  /** The server's note of the board that those moves lead to, without which it won't check the next one */
  position?: string;
  /** Whether moves are on their way to the server */
  busy: boolean;
}

const startGame = (key: string, init: PuzzleStateInit): Game => ({
  key,
  init,
  state: new PuzzleState(init),
  checked: 0,
  busy: false
});

/** The game of the given puzzle, which is a new one whenever the player or the puzzle changes */
const useGame = (key: string, init: PuzzleStateInit): Game => {
  const [game, setGame] = useState(() => startGame(key, init));

  if (game.key === key && game.init === init) return game;

  const next = startGame(key, init);
  setGame(next);

  return next;
};

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
  /** Whether the last moves couldn't be checked, which leaves the game unable to go any further until they are */
  stalled: boolean;
  /** Tries again to check moves that couldn't be */
  retry: () => void;
} => {
  // Each player has a game of their own, so a change of player is a change of game
  const key = getGameKey(puzzleID, usePlayer()?.did);
  const game = useGame(key, init);
  const { state } = game;
  const moves = useMoves(state);
  const win = useWin(state);
  const [stalled, setStalled] = useState<Game | null>(null);

  useHints(state);

  /**
   * Brings the server up to date with the game.
   *
   * The game is only saved once all of it has been checked, so that what's
   * saved is always a board along with the server's note of that same board.
   * Moves that were still on their way are lost if the page goes away, and
   * can simply be made again.
   */
  const check = useCallback(async (): Promise<void> => {
    if (game.busy) return;

    game.busy = true;

    let restarted = false;

    try {
      while (!state.win && game.checked < state.history.length - 1) {
        const next = game.checked + 1;
        const guesses = state.history.slice(next, next + MAX_GUESSES);

        try {
          // Each call has to settle before the next starts, so that their results are applied in order
          // oxlint-disable-next-line no-await-in-loop
          const { hints, from } = await fetch(`/api/check`, {
            query: {
              puzzle: puzzleID,
              guesses: guesses.join(`,`),
              ...(game.position && { from: game.position })
            }
          });

          game.position = from;
          game.checked += guesses.length;
          state.validate(hints);
        } catch (cause) {
          // The note can't be used, and only the game itself can stand in for it: every move from the start is a move the server can check without one
          if (
            !(cause instanceof FetchError && cause.status === 409) ||
            restarted
          ) {
            throw cause;
          }

          restarted = true;
          game.checked = 0;
          game.position = undefined;
        }
      }

      setStalled((current) => (current === game ? null : current));

      if (persist) {
        const [width, history, hint, reported = ``] = state.snapshot;

        try {
          localStorage.setItem(
            game.key,
            [width, history, hint, reported, game.position].join(`|`)
          );
        } catch {
          // A game that can't be saved can still be played, for as long as the page stays open
        }
      }
    } catch (cause) {
      console.error(`Couldn't check the game's moves`, cause);
      setStalled(game);
    } finally {
      game.busy = false;
    }
  }, [game, state, puzzleID, persist]);

  const resume = useCallback(
    (saved: string | null) => {
      const found = readSavedGame(saved, state.initial.toString());

      // A saved game is only of this puzzle if it began where this puzzle does. One that didn't is of a puzzle that has since been remade, which happens in development.
      if (!found) return;

      state.restore([
        state.config.width,
        found.history,
        found.hints,
        found.reported
      ]);
      game.position = found.from;
      // Without a note, there is no telling how far the server had got with it
      game.checked = found.from ? state.history.length - 1 : 0;
      void check();
    },
    [game, state, check]
  );

  useEffect(() => {
    if (!persist) return;

    try {
      resume(localStorage.getItem(key));

      // purge puzzles older than yesterday, utc-0 + 32hrs
      Object.keys(localStorage).forEach((stored) => {
        if (filterExpiredDates(getPuzzleOfKey(stored))) {
          localStorage.removeItem(stored);
        }
      });
    } catch {
      // Storage can be unavailable, e.g. when site data is blocked. The game is still there to be played, it just won't be kept.
    }
  }, [key, persist, resume]);

  const rotate = useCallback(
    (rowOrCol: number, dir: `down` | `left` | `right` | `up`) => {
      state.getNextState(rowOrCol, dir);
      void check();
    },
    [check, state]
  );

  const retry = useCallback(() => {
    void check();
  }, [check]);

  return {
    initial: state.initial,
    current: new Grid(useMatrix(state), init[0]),
    moves,
    win,
    rotate,
    resume,
    stalled: stalled === game,
    retry,
    target: state.target,
    history: state.history,
    getHintAt: state.getHintAt,
    isRowCorrect: state.isRowCorrect
  };
};
