// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { DialogProvider } from "@ariakit/react";
import { isSwipedAway, Sheet } from "../Sheet";

describe(`isSwipedAway`, () => {
  // A screen that is 800 tall, holding a sheet that is 300 tall
  const scroller = { scrollHeight: 1100, clientHeight: 800 };

  it(`isn't swiped away while any of the sheet is still on screen`, () => {
    // Letting go partway must leave the sheet for the browser to settle, either open or shut
    expect(isSwipedAway({ ...scroller, scrollTop: 0 })).toBe(false);
    expect(isSwipedAway({ ...scroller, scrollTop: -150 })).toBe(false);
    expect(isSwipedAway({ ...scroller, scrollTop: -298 })).toBe(false);
  });

  it(`is swiped away once the whole sheet has left the screen`, () => {
    expect(isSwipedAway({ ...scroller, scrollTop: -300 })).toBe(true);
  });

  it(`allows for scroll offsets that stop a fraction short`, () => {
    // Browsers round offsets on screens that have more than one pixel per unit
    expect(isSwipedAway({ ...scroller, scrollTop: -299.5 })).toBe(true);
  });

  it(`isn't swiped away when there is nothing to swipe`, () => {
    // Before it's laid out a sheet has no size, and must not be taken for one that has been dismissed
    expect(
      isSwipedAway({ scrollHeight: 800, clientHeight: 800, scrollTop: 0 })
    ).toBe(false);
  });
});

describe(`sheet`, () => {
  let root: Root;
  let container: HTMLElement;

  const Menu: React.FC = () => (
    <DialogProvider defaultOpen>
      <Sheet aria-label="Menu">
        <button type="button">How to play</button>
      </Sheet>
    </DialogProvider>
  );

  const getSheet = (): Element | null =>
    document.querySelector(`[role="dialog"]`);

  /** Scrolls the sheet as a swipe would, to the given distance from where it rests */
  const swipe = async (distance: number): Promise<void> => {
    const scroller = getSheet()!.parentElement!.parentElement!;
    Object.defineProperties(scroller, {
      scrollHeight: { configurable: true, value: 1100 },
      clientHeight: { configurable: true, value: 800 },
      scrollTop: { configurable: true, value: -distance }
    });
    await act(async () => {
      scroller.dispatchEvent(new Event(`scroll`));
    });
  };

  beforeEach(async () => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<Menu />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it(`is a dialog, so that it's announced and holds focus like one`, () => {
    expect(getSheet()?.getAttribute(`aria-label`)).toBe(`Menu`);
    expect(getSheet()?.textContent).toBe(`How to play`);
  });

  it(`stays open when a swipe stops short of dismissing it`, async () => {
    await swipe(120);

    expect(getSheet()).not.toBeNull();
  });

  it(`leaves the page once it has been swiped off of the screen`, async () => {
    // The scroller only moves the sheet out of sight. Were it left in the page, it would go on covering the game unseen.
    await swipe(300);

    expect(getSheet()).toBeNull();
    expect(document.querySelector(`[class*="scroller"]`)).toBeNull();
  });
});
