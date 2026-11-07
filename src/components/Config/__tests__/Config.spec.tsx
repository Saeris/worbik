// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { signOut } from "../../../auth/oauth";
import { getPlayer, setPlayer } from "../../../auth/player";
import { Config } from "../Config";

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

vi.mock(`../../../auth/oauth`, () => ({
  signOut: vi.fn<() => Promise<void>>()
}));

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;

describe(`config`, () => {
  const onDelete = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const open = async (): Promise<void> => {
    await act(async () => {
      root.render(<Config onDelete={onDelete} />);
    });
  };

  const scheme = (value: string): HTMLInputElement | null =>
    container.querySelector(`input[value="${value}"]`);

  const pick = async (value: string): Promise<void> => {
    await act(async () => {
      scheme(value)?.click();
    });
  };

  const press = async (name: string): Promise<void> => {
    await act(async () => {
      [...container.querySelectorAll(`button`)]
        .find((button) => button.textContent === name)
        ?.click();
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    localStorage.clear();
    delete document.documentElement.dataset.theme;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  describe(`the color scheme`, () => {
    it(`follows the system until told otherwise`, async () => {
      await open();

      expect(scheme(`system`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it(`applies a choice, and remembers it`, async () => {
      await open();
      await pick(`dark`);

      expect(document.documentElement.dataset.theme).toBe(`dark`);
      expect(localStorage.getItem(`theme`)).toBe(`dark`);
    });

    it(`picks up where a player left off`, async () => {
      // The same key that `next-themes` used, so that returning players keep their choice
      localStorage.setItem(`theme`, `light`);
      await open();

      expect(scheme(`light`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBe(`light`);
    });

    it(`forgets a choice when going back to the system's`, async () => {
      await open();
      await pick(`dark`);
      await pick(`system`);

      expect(document.documentElement.dataset.theme).toBeUndefined();
      expect(localStorage.getItem(`theme`)).toBeNull();
    });

    it(`ignores whatever else has been kept under that name`, async () => {
      localStorage.setItem(`theme`, `sepia`);
      await open();

      expect(scheme(`system`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBeUndefined();
    });

    it(`follows a change made in another tab`, async () => {
      await open();
      localStorage.setItem(`theme`, `dark`);
      await act(async () => {
        window.dispatchEvent(new StorageEvent(`storage`));
      });

      expect(scheme(`dark`)?.checked).toBe(true);
      expect(document.documentElement.dataset.theme).toBe(`dark`);
    });

    it(`tells the phone's status bar, which is outside of the page`, async () => {
      const meta = document.head.appendChild(document.createElement(`meta`));

      meta.name = `theme-color`;
      document.body.style.backgroundColor = `rgb(1, 2, 3)`;
      await open();

      expect(meta.getAttribute(`content`)).toBe(`rgb(1, 2, 3)`);
      meta.remove();
      document.body.style.backgroundColor = ``;
    });
  });

  describe(`the account`, () => {
    it(`has nothing to offer someone who hasn't signed in`, async () => {
      await open();

      expect(container.textContent).not.toContain(`Sign out`);
      expect(container.textContent).not.toContain(`Delete my Worbik data`);
    });

    it(`says who is signed in`, async () => {
      setPlayer(alice);
      await open();

      expect(container.textContent).toContain(`@alice.test`);
    });

    it(`names a player without a handle by their identity`, async () => {
      setPlayer({ did: alice.did, handle: null });
      await open();

      expect(container.textContent).toContain(alice.did);
    });

    it(`signs a player out here straight away, and tells their server`, async () => {
      // On a shared device, being signed out can't wait on a server that may not answer
      vi.mocked(signOut).mockReturnValue(new Promise(() => {}));
      setPlayer(alice);
      await open();
      await press(`Sign out`);

      expect(getPlayer()).toBeNull();
      await vi.waitFor(() => {
        expect(signOut).toHaveBeenCalledExactlyOnceWith(alice.did);
      });
    });

    it(`signs a player out even when their server can't be told`, async () => {
      vi.mocked(signOut).mockRejectedValue(new Error(`Offline`));
      setPlayer(alice);
      await open();
      await press(`Sign out`);

      expect(getPlayer()).toBeNull();
    });

    it(`leads to deleting a player's data, without doing anything yet`, async () => {
      setPlayer(alice);
      await open();
      await press(`Delete my Worbik data`);

      expect(onDelete).toHaveBeenCalledTimes(1);
      expect(getPlayer()).toStrictEqual(alice);
    });
  });
});
