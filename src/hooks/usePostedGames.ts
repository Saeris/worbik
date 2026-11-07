import { useEffect, useState } from "react";
import { fetch } from "void/client";
import { SignedOutError } from "#auth/errors";
import { loadOAuth } from "#auth/load";
import { getProgress, toSavedGame } from "#utils/progress";
import { GET_SOLVES } from "#utils/service";
import { getGameKey, markPosted } from "#utils/solves";
import { REQUEST_TIMEOUT } from "#utils/withTimeout";
import { usePlayer } from "./usePlayer";

/** Whether this device already has a game of a puzzle that matches what the player posted */
const hasGame = (did: string, puzzle: string, moves: number): boolean => {
  const game = getProgress(localStorage.getItem(getGameKey(puzzle, did)));

  return game?.solved === true && game.moves === moves;
};

/**
 * Brings this device up to date with the solves that the player who is
 * signed in has posted from any other, so that a puzzle they've solved can't
 * be played again here.
 *
 * What was posted is what counts, as a player's first solve is the one
 * that's kept. So it takes the place of whatever is on the board, whether
 * that's a game under way or another solve of the same puzzle.
 *
 * It looks when a puzzle is opened, and again when it's solved, in case the
 * look before it failed or the other device was used in the meantime.
 *
 * Returns whether the player has to sign in again for that to happen. They
 * stay signed in until they do, as signing them out would swap the game in
 * front of them for the one kept for nobody in particular.
 */
export const usePostedGames = (
  puzzleID: string,
  win: boolean,
  resume: (saved: string | null) => void
): boolean => {
  const did = usePlayer()?.did;
  // Who has to sign in again, so that it's never said to whoever signs in next
  const [expired, setExpired] = useState<string | null>(null);

  useEffect(() => {
    if (!did) return undefined;

    // Set when another puzzle or player takes over, so that nothing more is made of this
    const stale = new AbortController();
    // Asked afresh each time, as it changes while a request is being waited on
    const isStale = (): boolean => stale.signal.aborted;
    const [day] = puzzleID.split(`_`);

    const sync = async (): Promise<void> => {
      const posted = await fetch(`/api/solves`, {
        query: { player: did, day },
        timeout: REQUEST_TIMEOUT
      });
      const missing = posted.some(
        ({ puzzle, moves }) => !hasGame(did, puzzle, moves)
      );

      // Nearly every time, there is nothing more to do. Only a device that's behind has to ask for proof.
      if (!missing || isStale()) return;

      // Only fetched by those who have signed in
      const { getProof } = await loadOAuth();
      const games = await fetch(`/api/solves`, {
        method: `POST`,
        body: { day },
        headers: { authorization: `Bearer ${await getProof(did, GET_SOLVES)}` },
        timeout: REQUEST_TIMEOUT
      });

      if (isStale()) return;

      for (const game of games) {
        const saved = toSavedGame(game);

        localStorage.setItem(getGameKey(game.puzzle, did), saved);
        markPosted(game.puzzle, did);
        if (game.puzzle === puzzleID) resume(saved);
      }
    };

    const attempt = async (): Promise<void> => {
      try {
        await sync();
      } catch (cause) {
        // This device can't be brought up to date without a new sign-in, which is what they will be asked for
        if (cause instanceof SignedOutError && !isStale()) setExpired(did);
        // Anything else can wait. A puzzle played in the meantime can't take the place of what was posted.
      }
    };

    void attempt();

    return (): void => {
      stale.abort();
    };
  }, [did, puzzleID, win, resume]);

  return did !== undefined && expired === did;
};
