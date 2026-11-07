import { useCallback, useRef } from "react";

export type SwipeDirection = `down` | `left` | `right` | `up`;

/** How far a swipe has to travel in order to count, as a fraction of the width of the tile it began on */
const THRESHOLD = 0.4;

/** The least that a swipe has to travel, for tiles small enough that a fraction of one is covered by accident */
const MIN_DISTANCE = 16;

/**
 * Works out which way a swipe went from how far it ended up from where it
 * began, or that it wasn't a swipe at all if that isn't far enough.
 */
export const getSwipeDirection = (
  dx: number,
  dy: number,
  threshold: number
): SwipeDirection | null => {
  if (Math.max(Math.abs(dx), Math.abs(dy)) < threshold) return null;
  if (Math.abs(dx) > Math.abs(dy)) return dx < 0 ? `left` : `right`;
  return dy < 0 ? `up` : `down`;
};

interface Swipe {
  pointer: number;
  x: number;
  y: number;
  row: number;
  column: number;
  threshold: number;
}

/**
 * Rotates the row or column of a tile when it is swiped across.
 *
 * A swipe is one gesture that makes at most one move, however far or fast
 * it travels. It is only judged once the finger is lifted, by where it ended
 * up, so there is no momentum to carry it through several moves at once, and
 * a swipe that was begun by mistake can be taken back by returning to where
 * it started before letting go.
 *
 * Returns the props for an element which contains tiles that each have a
 * `data-row` and `data-column` attribute.
 */
export const useSwipe = (
  rotate: (rowOrCol: number, dir: SwipeDirection) => void
): Pick<
  React.DOMAttributes<HTMLElement>,
  "onPointerCancel" | "onPointerDown" | "onPointerUp"
> => {
  const swipe = useRef<Swipe | null>(null);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const tile =
        event.target instanceof Element
          ? event.target.closest<HTMLElement>(`[data-row][data-column]`)
          : null;

      // A swipe belongs to the finger that began it, so any others that land in the meantime are ignored. Only the first finger down is primary, so one that is takes the place of a swipe whose end was never heard about.
      if (!tile || !event.isPrimary) return;

      swipe.current = {
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        row: Number(tile.dataset.row),
        column: Number(tile.dataset.column),
        threshold: Math.max(
          MIN_DISTANCE,
          tile.getBoundingClientRect().width * THRESHOLD
        )
      };
      try {
        // Keeps the swipe going when it leaves the board, which only touches do on their own
        tile.setPointerCapture(event.pointerId);
      } catch {
        // The swipe still works without this, for as long as it stays over the board
      }
    },
    []
  );

  const onPointerUp = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const { current } = swipe;

      if (current?.pointer !== event.pointerId) return;

      swipe.current = null;

      const direction = getSwipeDirection(
        event.clientX - current.x,
        event.clientY - current.y,
        current.threshold
      );

      if (!direction) return;

      rotate(
        direction === `left` || direction === `right`
          ? current.row
          : current.column,
        direction
      );
    },
    [rotate]
  );

  const onPointerCancel = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (swipe.current?.pointer === event.pointerId) swipe.current = null;
    },
    []
  );

  return { onPointerDown, onPointerUp, onPointerCancel };
};
