import { useCallback, useEffect, useState } from "react";
import * as v from "valibot";
import { fetch, FetchError } from "void/client";
import { isOpenForScores, isPuzzleDay } from "#utils";
import { SUBMIT_SCORE } from "#utils/service";
import { markPosted, recordSolve } from "#utils/solves";
import { usePlayer } from "./usePlayer";

/** A score as a leaderboard lists it, in the order that it ranks */
export interface RankedScore {
  readonly did: string;
  readonly handle: string | null;
  readonly moves: number;
}

/**
 * What has become of a solve:
 *
 * - `signed-out`: it can be posted, once the player says who they are
 * - `posting`: it's being posted
 * - `posted`: it has a place on the leaderboard
 * - `expired`: it couldn't be posted, as the player's sign-in has run out
 * - `failed`: it couldn't be posted, and it's worth trying again
 * - `closed`: it was made after the puzzle's day ended, and isn't ranked
 */
export type ScoreStatus =
  | `closed`
  | `expired`
  | `failed`
  | `posted`
  | `posting`
  | `signed-out`;

export interface Score {
  /** What has become of the solve, once that's known */
  readonly status: ScoreStatus | null;
  /** The puzzle's leaderboard, once it has loaded */
  readonly scores: readonly RankedScore[] | null;
  /** Why the solve couldn't be posted, in the words of whatever turned it away, for working out what went wrong */
  readonly detail: string | null;
  /** Whether a solve that couldn't be posted is being posted again */
  readonly retrying: boolean;
  /** Tries again to post a solve that couldn't be posted */
  readonly retry: () => void;
}

/** Loads the leaderboard of a puzzle, or `null` if it can't be reached */
export const loadScores = async (
  puzzleID: string
): Promise<readonly RankedScore[] | null> => {
  try {
    return await fetch(`/api/scores`, { query: { puzzle: puzzleID } });
  } catch {
    // A solve can be posted without its leaderboard having loaded
    return null;
  }
};

/** The solves that are on their way to the server, so that none is sent twice over */
const posting = new Map<string, Promise<void>>();

const send = async (
  puzzleID: string,
  history: readonly string[],
  did: string
): Promise<void> => {
  // Only fetched by those who have signed in
  const { getProof } = await import(`#auth/oauth`);

  await fetch(`/api/scores`, {
    method: `POST`,
    body: { puzzle: puzzleID, history: [...history] },
    headers: { authorization: `Bearer ${await getProof(did, SUBMIT_SCORE)}` }
  });
  markPosted(puzzleID, did);
};

const post = async (
  puzzleID: string,
  history: readonly string[],
  did: string
): Promise<void> => {
  const pending = posting.get(puzzleID) ?? send(puzzleID, history, did);
  posting.set(puzzleID, pending);

  try {
    await pending;
  } finally {
    posting.delete(puzzleID);
  }
};

/** What an answer from the server says for itself, if it says anything */
const message = v.object({ message: v.string() });

/**
 * Why a solve couldn't be posted: in terms of what the player can do about
 * it, and in the words of whatever turned it away.
 */
const explain = async (
  cause: unknown
): Promise<{ status: ScoreStatus; detail: string | null }> => {
  const { SignedOutError } = await import(`#auth/oauth`);

  if (cause instanceof SignedOutError)
    return { status: `expired`, detail: null };

  if (cause instanceof FetchError) {
    const said = v.safeParse(message, cause.data);
    const detail = `The server answered ${cause.status}${said.success ? `: ${said.output.message}` : ``}`;

    // The server is the judge of when a puzzle's day has ended, whatever this device's clock says
    return { status: cause.status === 403 ? `closed` : `failed`, detail };
  }

  return {
    status: `failed`,
    detail: cause instanceof Error ? cause.message : String(cause)
  };
};

/**
 * Posts a player's solve of a puzzle to its leaderboard, and follows what
 * becomes of it.
 *
 * A solve is posted as soon as there is someone signed in to post it as,
 * whether they were signed in when they solved the puzzle or sign in
 * afterwards. Only a solve that was made during the puzzle's own day is
 * posted: the server would turn any other away, so it's never sent.
 */
export const useScore = (
  puzzleID: string,
  win: boolean,
  history: readonly string[]
): Score => {
  const did = usePlayer()?.did;
  const [status, setStatus] = useState<ScoreStatus | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  const [scores, setScores] = useState<readonly RankedScore[] | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!win) return undefined;

    // Set when the solve is no longer the one being followed, so that nothing more is made of it
    const stale = new AbortController();
    // Asked afresh each time, as it changes while a request is being waited on
    const isStale = (): boolean => stale.signal.aborted;

    const follow = async (): Promise<void> => {
      const solve = recordSolve(puzzleID, did);
      const loaded = await loadScores(puzzleID);

      if (isStale()) return;
      setScores(loaded);

      if (solve.posted) {
        setStatus(`posted`);
      } else if (
        !isPuzzleDay(puzzleID, new Date(solve.at)) ||
        !isOpenForScores(puzzleID)
      ) {
        setStatus(`closed`);
      } else if (did) {
        setStatus(`posting`);

        try {
          await post(puzzleID, history, did);
          const ranked = await loadScores(puzzleID);

          if (isStale()) return;
          setScores(ranked);
          setStatus(`posted`);
        } catch (cause) {
          const reason = await explain(cause);

          if (isStale()) return;
          console.error(`Couldn't post the score`, cause);
          setDetail(reason.detail);
          setStatus(reason.status);
        }
      } else {
        setStatus(`signed-out`);
      }
    };

    void follow();

    return (): void => {
      stale.abort();
    };
  }, [puzzleID, win, history, did, attempt]);

  const retry = useCallback(() => {
    setAttempt((count) => count + 1);
  }, []);

  return {
    status,
    scores,
    detail,
    retrying: status === `posting` && attempt > 0,
    retry
  };
};
