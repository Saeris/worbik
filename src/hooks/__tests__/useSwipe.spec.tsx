// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { getSwipeDirection, useSwipe, type SwipeDirection } from "../useSwipe";

describe(`getSwipeDirection`, () => {
  it(`goes whichever way the swipe traveled furthest`, () => {
    expect(getSwipeDirection(-40, 10, 16)).toBe(`left`);
    expect(getSwipeDirection(40, -10, 16)).toBe(`right`);
    expect(getSwipeDirection(10, -40, 16)).toBe(`up`);
    expect(getSwipeDirection(-10, 40, 16)).toBe(`down`);
  });

  it(`isn't a swipe until it has traveled far enough`, () => {
    // A tap, or a finger that drifts while resting on the board, must not move anything
    expect(getSwipeDirection(0, 0, 16)).toBeNull();
    expect(getSwipeDirection(15, -15, 16)).toBeNull();
    expect(getSwipeDirection(16, 0, 16)).toBe(`right`);
  });
});

describe(`useSwipe`, () => {
  const rotate = vi.fn<(rowOrCol: number, dir: SwipeDirection) => void>();
  let root: Root;
  let container: HTMLElement;

  /** A board with a single tile, in the third row and second column */
  const Board: React.FC = () => (
    <div {...useSwipe(rotate)}>
      <button type="button" data-row={2} data-column={1}>
        A
      </button>
      <button type="button" id="arrow">
        Rotate
      </button>
    </div>
  );

  const pointer = (
    type: string,
    x: number,
    y: number,
    { id = 1, isPrimary = true, target = `[data-row]` } = {}
  ): void => {
    container.querySelector(target)!.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        clientX: x,
        clientY: y,
        pointerId: id,
        isPrimary
      })
    );
  };

  beforeEach(async () => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<Board />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    rotate.mockReset();
    vi.unstubAllGlobals();
  });

  it(`rotates the row of a tile that is swiped sideways`, () => {
    pointer(`pointerdown`, 100, 100);
    pointer(`pointerup`, 60, 104);

    expect(rotate).toHaveBeenCalledExactlyOnceWith(2, `left`);
  });

  it(`rotates the column of a tile that is swiped up or down`, () => {
    pointer(`pointerdown`, 100, 100);
    pointer(`pointerup`, 96, 150);

    expect(rotate).toHaveBeenCalledExactlyOnceWith(1, `down`);
  });

  it(`makes a single move however far or fast the swipe travels`, () => {
    // Were moves to follow the finger, a flick across the board would make several at once
    pointer(`pointerdown`, 100, 100);
    for (let x = 120; x <= 900; x += 20) pointer(`pointermove`, x, 100);
    pointer(`pointerup`, 900, 100);

    expect(rotate).toHaveBeenCalledExactlyOnceWith(2, `right`);
  });

  it(`makes no move for a tap`, () => {
    pointer(`pointerdown`, 100, 100);
    pointer(`pointerup`, 103, 98);

    expect(rotate).not.toHaveBeenCalled();
  });

  it(`can be taken back by returning to where it began`, () => {
    // Nothing is decided until the finger lifts, so a swipe begun by mistake costs no move
    pointer(`pointerdown`, 100, 100);
    pointer(`pointermove`, 180, 100);
    pointer(`pointermove`, 104, 100);
    pointer(`pointerup`, 104, 100);

    expect(rotate).not.toHaveBeenCalled();
  });

  it(`makes no move when the swipe is interrupted`, () => {
    pointer(`pointerdown`, 100, 100);
    pointer(`pointercancel`, 180, 100);
    pointer(`pointerup`, 180, 100);

    expect(rotate).not.toHaveBeenCalled();
  });

  it(`only follows the finger that began the swipe`, () => {
    pointer(`pointerdown`, 100, 100);
    pointer(`pointerdown`, 300, 300, { id: 2, isPrimary: false });
    pointer(`pointerup`, 300, 400, { id: 2, isPrimary: false });

    expect(rotate).not.toHaveBeenCalled();

    pointer(`pointerup`, 100, 60);

    expect(rotate).toHaveBeenCalledExactlyOnceWith(1, `up`);
  });

  it(`isn't held up by a swipe whose end was never heard about`, () => {
    // Should a finger lift without the board finding out, every swipe after it would otherwise be ignored until a reload
    pointer(`pointerdown`, 100, 100, { id: 1 });
    pointer(`pointerdown`, 100, 100, { id: 2 });
    pointer(`pointerup`, 0, 100, { id: 2 });

    expect(rotate).toHaveBeenCalledTimes(1);
  });

  it(`leaves the buttons around the board alone`, () => {
    pointer(`pointerdown`, 100, 100, { target: `#arrow` });
    pointer(`pointerup`, 200, 100, { target: `#arrow` });

    expect(rotate).not.toHaveBeenCalled();
  });
});
