// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { getProof, signOut } from "../../../auth/oauth";
import {
  getAccounts,
  getPlayer,
  rememberAccount,
  setPlayer
} from "../../../auth/player";
import { DELETE_ACCOUNT } from "../../../utils/service";
import { getGameKey } from "../../../utils/solves";
import { DeleteAccount } from "../DeleteAccount";

/** Stands in for a sign-in that doesn't cover deleting an account */
class SignedOutError extends Error {}

vi.mock(`void/client`, () => ({ fetch: vi.fn<() => Promise<unknown>>() }));

vi.mock(`../../../auth/oauth`, () => ({
  getProof: vi.fn<() => Promise<string>>(),
  signOut: vi.fn<() => Promise<void>>(),
  // Hoisted above the class that it names, which exists by the time that this is read
  get SignedOutError() {
    return SignedOutError;
  }
}));

const request = vi.mocked(
  fetch as unknown as (path: string, options: unknown) => Promise<unknown>
);
const proof = vi.mocked(getProof);

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const puzzle = `11-06-2026_5x5`;

describe(`deleteAccount`, () => {
  const onSignIn = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const getButton = (): HTMLButtonElement =>
    container.querySelector(`button[type="submit"]`)!;

  /** Types into the field the way that a player does */
  const type = async (value: string): Promise<void> => {
    const input = container.querySelector(`input`)!;

    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        `value`
      )?.set?.call(input, value);
      input.dispatchEvent(new Event(`input`, { bubbles: true }));
    });
  };

  const submit = async (): Promise<void> => {
    await act(async () => {
      container
        .querySelector(`form`)
        ?.dispatchEvent(
          new Event(`submit`, { bubbles: true, cancelable: true })
        );
    });
  };

  beforeEach(async () => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    setPlayer(alice);
    rememberAccount(alice);
    localStorage.setItem(getGameKey(puzzle, alice.did), `a game`);
    proof.mockResolvedValue(`a-token`);
    request.mockResolvedValue({ deleted: true });
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    await act(async () => {
      root.render(<DeleteAccount onSignIn={onSignIn} />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    localStorage.clear();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it(`warns that it's permanent`, () => {
    expect(container.textContent).toContain(`can’t be undone`);
    expect(container.textContent).toContain(`every leaderboard`);
  });

  it(`can't be done until the player has typed their handle`, async () => {
    // This can't be reversed, so it must never be one stray tap away
    expect(getButton().disabled).toBe(true);

    await type(`alice.tes`);
    expect(getButton().disabled).toBe(true);

    await type(`bob.test`);
    expect(getButton().disabled).toBe(true);

    await type(`alice.test`);
    expect(getButton().disabled).toBe(false);
  });

  it(`takes a handle however it's usually written`, async () => {
    // Handles are shown with an @, and phones capitalize what's typed
    await type(`@Alice.Test `);

    expect(getButton().disabled).toBe(false);
  });

  it(`does nothing if it's submitted without the handle`, async () => {
    // Pressing Enter in the field doesn't care whether the button is enabled
    await type(`nope`);
    await submit();

    expect(request).not.toHaveBeenCalled();
  });

  it(`asks the server with a proof that's only good for this`, async () => {
    await type(`alice.test`);
    await submit();

    expect(proof).toHaveBeenCalledExactlyOnceWith(alice.did, DELETE_ACCOUNT);
    expect(request).toHaveBeenCalledExactlyOnceWith(`/api/account`, {
      method: `DELETE`,
      headers: { authorization: `Bearer a-token` }
    });
  });

  it(`leaves nothing of the player on this device`, async () => {
    await type(`alice.test`);
    await submit();

    expect(getPlayer()).toBeNull();
    expect(getAccounts()).toStrictEqual([]);
    expect(localStorage.getItem(getGameKey(puzzle, alice.did))).toBeNull();
    expect(signOut).toHaveBeenCalledExactlyOnceWith(alice.did);
  });

  it(`says that it's done, and that they can come back`, async () => {
    await type(`alice.test`);
    await submit();

    expect(container.textContent).toContain(`has been deleted`);
    expect(container.textContent).toContain(`sign in again at any time`);
  });

  it(`changes nothing if the server can't do it`, async () => {
    // Being told that an account is gone when it isn't would be worse than being told to try again
    request.mockRejectedValue(new Error(`Offline`));
    await type(`alice.test`);
    await submit();

    expect(container.textContent).toContain(`nothing was changed`);
    expect(getPlayer()).toStrictEqual(alice);
    expect(localStorage.getItem(getGameKey(puzzle, alice.did))).toBe(`a game`);
  });

  it(`asks a player to sign in again if their sign-in doesn't cover this`, async () => {
    proof.mockRejectedValue(new SignedOutError());
    await type(`alice.test`);
    await submit();

    expect(request).not.toHaveBeenCalled();
    expect(container.textContent).toContain(`sign in again`);
    expect(getPlayer()).toStrictEqual(alice);
  });
});
