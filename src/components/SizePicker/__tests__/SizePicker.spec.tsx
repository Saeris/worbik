// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { setPlayer } from "../../../auth/player";
import { getGameKey } from "../../../utils/solves";
import { SizePicker } from "../SizePicker";

vi.mock(`@void/react`, () => ({
  Link: ({
    href,
    children,
    ...props
  }: React.ComponentProps<`a`>): React.ReactNode => (
    <a href={href} {...props}>
      {children}
    </a>
  )
}));

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

const day = `11-07-2026`;
const puzzle = `${day}_6x8`;
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;

/** A game of two moves, which is what a save looks like */
const underWay = `5|bcaefd,abcefd,abcfde|ABC   `;
const solved = `5|bcaefd,abcefd,abcdef|ABCDEF`;

describe(`sizePicker`, () => {
  let root: Root;
  let container: HTMLElement;

  const open = async (): Promise<void> => {
    await act(async () => {
      root.render(<SizePicker puzzleID={puzzle} width={6} height={8} />);
    });
    await act(async () => {
      container.querySelector(`button`)?.click();
    });
  };

  const link = (size: string): HTMLAnchorElement | null =>
    document.querySelector(`a[href="/${size}"]`);

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(new Date(`2026-11-07T22:30:00Z`));
    container = document.body.appendChild(document.createElement(`div`));
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    document.body.innerHTML = ``;
    setPlayer(null);
    localStorage.clear();
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it(`names the board that's being played`, async () => {
    await act(async () => {
      root.render(<SizePicker puzzleID={puzzle} width={6} height={8} />);
    });

    expect(container.textContent).toBe(`6×8`);
  });

  it(`lists all sixteen of the day's puzzles`, async () => {
    await open();

    expect(document.querySelectorAll(`nav a`)).toHaveLength(16);
  });

  it(`says which one is open`, async () => {
    await open();

    expect(link(`6x8`)?.getAttribute(`aria-current`)).toBe(`page`);
    // Neither a board of the same width nor one of the same height is this one
    expect(link(`6x6`)?.hasAttribute(`aria-current`)).toBe(false);
    expect(link(`8x8`)?.hasAttribute(`aria-current`)).toBe(false);
  });

  it(`tells a game that's under way from one that's solved`, async () => {
    localStorage.setItem(`${day}_5x5`, underWay);
    localStorage.setItem(`${day}_7x7`, solved);
    await open();

    expect(link(`5x5`)?.getAttribute(`aria-label`)).toBe(
      `5×5, playing, at 2 moves`
    );
    expect(link(`7x7`)?.getAttribute(`aria-label`)).toBe(
      `7×7, solved in 2 moves`
    );
    expect(link(`8x8`)?.getAttribute(`aria-label`)).toBe(`8×8, not played`);
  });

  it(`counts what's been solved today`, async () => {
    localStorage.setItem(`${day}_5x5`, underWay);
    localStorage.setItem(`${day}_7x7`, solved);
    await open();

    expect(document.body.textContent).toContain(`1 of 16 solved`);
  });

  it(`leaves out games from other days`, async () => {
    localStorage.setItem(`11-06-2026_5x5`, solved);
    await open();

    expect(document.body.textContent).toContain(`0 of 16 solved`);
  });

  it(`shows a player their own games, and not someone else's`, async () => {
    // Two people can share a device, and what one has solved says nothing about the other
    localStorage.setItem(`${day}_5x5`, solved);
    localStorage.setItem(getGameKey(`${day}_6x6`, alice.did), solved);
    setPlayer(alice);
    await open();

    expect(link(`5x5`)?.getAttribute(`aria-label`)).toBe(`5×5, not played`);
    expect(link(`6x6`)?.getAttribute(`aria-label`)).toBe(
      `6×6, solved in 2 moves`
    );
  });

  it(`says how long is left until the next day's puzzles`, async () => {
    // It's half past ten at night, and the day's puzzles change over at ten in the morning
    await open();

    expect(document.body.textContent).toContain(`New puzzles in 11 h 30 min.`);
  });

  it(`doesn't count down past the end of the day`, async () => {
    // A page left open can outlast its puzzles, and "in -3 h" would make no sense
    vi.setSystemTime(new Date(`2026-11-08T10:30:00Z`));
    await open();

    expect(document.body.textContent).not.toContain(`New puzzles in`);
  });

  it(`closes once a puzzle is picked`, async () => {
    // The page that's linked to may be the one that's open, which wouldn't close it by itself
    await open();
    await act(async () => {
      link(`6x8`)?.addEventListener(`click`, (event) => {
        event.preventDefault();
      });
      link(`6x8`)?.click();
    });

    expect(link(`5x5`)).toBeNull();
  });
});
