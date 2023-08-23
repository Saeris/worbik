import { useCallback } from "react";
import { useQueuedAPICall } from "./useQueuedAPICall";
import type { usePuzzle } from "../Game/usePuzzleState";

export const useRotate = (
  puzzleID: string,
  state: ReturnType<typeof usePuzzle>
): ((rowOrCol: number, dir: `up` | `down` | `left` | `right`) => void) => {
  const queue = useQueuedAPICall(
    useCallback(
      async (vals: string[]): Promise<void> => {
        const url = new URL(`/api/check`, window.location.origin);
        url.searchParams.set(`puzzle`, puzzleID);
        url.searchParams.set(`guesses`, vals.join(`,`));
        localStorage.setItem(
          puzzleID,
          state
            .validate((await (await fetch(url.href)).json()) as string[])
            .snapshot.join(`|`)
        );
      },
      [puzzleID, state]
    )
  );

  return useCallback(
    (rowOrCol: number, dir: `up` | `down` | `left` | `right`) => {
      if (!state.win) {
        queue(state.getNextState(rowOrCol, dir).toString());
      }
    },
    [queue, state]
  );
};
