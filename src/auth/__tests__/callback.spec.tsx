// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { completeSignIn } from "../oauth";
import { getAccounts, getPlayer, setPlayer } from "../player";

vi.mock(`../oauth`, () => ({
  completeSignIn: vi.fn<typeof completeSignIn>()
}));

vi.mock(`@void/react`, () => ({
  Link: ({
    href,
    children
  }: {
    href: string;
    children: React.ReactNode;
  }): React.ReactNode => <a href={href}>{children}</a>
}));

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const puzzle = `11-07-2026_5x5`;

describe(`the page that a player returns to`, () => {
  const replace = vi.fn<(path: string) => void>();
  let root: Root;
  let container: HTMLElement;

  const open = async (): Promise<void> => {
    // What's in progress is remembered by the module, as signing in can only be finished once
    vi.resetModules();

    const { default: Page } = await import(`../../pages/oauth/callback`);

    await act(async () => {
      root.render(<Page />);
    });
    await act(async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 20);
      });
    });
  };

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.stubGlobal(`location`, { replace });
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
    vi.mocked(completeSignIn).mockResolvedValue({
      player: alice,
      from: `/6x6`
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    setPlayer(null);
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it(`signs the player in, and returns them to their puzzle`, async () => {
    await open();

    expect(getPlayer()).toStrictEqual(alice);
    expect(replace).toHaveBeenCalledExactlyOnceWith(`/6x6`);
  });

  it(`remembers the account, for the next time they sign in`, async () => {
    await open();

    expect(getAccounts()).toStrictEqual([alice]);
  });

  it(`brings along the game that they signed in to post`, async () => {
    // This is how a score gets posted when the puzzle was solved first, so without it the solve is lost
    localStorage.setItem(puzzle, `a game`);
    await open();

    expect(localStorage.getItem(`${alice.did}/${puzzle}`)).toBe(`a game`);
  });

  it(`says so when it can't finish, and changes nothing`, async () => {
    vi.mocked(completeSignIn).mockRejectedValue(new Error(`Refused`));
    await open();

    expect(container.textContent).toContain(`Couldn’t sign you in`);
    expect(getPlayer()).toBeNull();
    expect(replace).not.toHaveBeenCalled();
  });
});
