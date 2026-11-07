// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { getPlayer, setPlayer } from "../../../auth/player";
import { DeleteAccount } from "../DeleteAccount";

vi.mock(`void/client`, () => ({ fetch: vi.fn<() => Promise<unknown>>() }));

// What a page sees once a deployment has replaced the file that it would have fetched
vi.mock(`../../../auth/oauth`, () => {
  throw new TypeError(`Failed to fetch dynamically imported module`);
});

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;

describe(`deleteAccount, on a page that's out of date`, () => {
  const reload = vi.fn<() => void>();
  const onSignIn = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const remove = async (): Promise<void> => {
    await act(async () => {
      root.render(<DeleteAccount onSignIn={onSignIn} />);
    });

    const field = container.querySelector(`input`);

    await act(async () => {
      // React tracks what a field holds, so it only hears of a change made past its back
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        `value`
      )?.set?.call(field, alice.handle);
      field?.dispatchEvent(new Event(`input`, { bubbles: true }));
    });
    await act(async () => {
      container
        .querySelector(`form`)
        ?.dispatchEvent(
          new Event(`submit`, { bubbles: true, cancelable: true })
        );
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 50);
      });
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.stubGlobal(`location`, { reload });
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    setPlayer(alice);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    reload.mockClear();
  });

  it(`asks the player to reload rather than doing it for them`, async () => {
    // A page that reloaded by itself would look like a deletion that had gone through
    await remove();

    expect(container.textContent).toContain(`Nothing was deleted`);
    expect(reload).not.toHaveBeenCalled();

    await act(async () => {
      [...container.querySelectorAll(`button`)]
        .find((button) => button.textContent === `Reload`)
        ?.click();
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it(`deletes nothing and keeps the player`, async () => {
    await remove();

    expect(fetch).not.toHaveBeenCalled();
    expect(getPlayer()).toStrictEqual(alice);
  });

  it(`doesn't blame an update for a lost connection`, async () => {
    // Reloading without a connection would only lose the page
    vi.spyOn(navigator, `onLine`, `get`).mockReturnValue(false);
    await remove();

    expect(container.textContent).toContain(`Try again in a moment`);
    expect(container.textContent).not.toContain(`Reload`);
  });
});
