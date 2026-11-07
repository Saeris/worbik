// @vitest-environment happy-dom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { fetch } from "void/client";
import { setPlayer } from "../../../auth/player";
import { Profile } from "../Profile";

vi.mock(`void/client`, () => ({
  fetch: vi.fn<() => Promise<unknown>>(),
  FetchError: class extends Error {}
}));

const request = vi.mocked(
  fetch as unknown as (
    path: string,
    options: { query: { player: string } }
  ) => Promise<unknown>
);

/** Midday on the 7th of November, when that day's puzzles are the ones being played */
const now = new Date(`2026-11-07T12:00:00Z`);
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const bob = { did: `did:plc:bob`, handle: null } as const;

const days = (...entries: [string, number][]): object => ({
  days: entries.map(([day, solved]) => ({ day, solved })),
  recent: []
});

describe(`profile`, () => {
  const onSignIn = vi.fn<() => void>();
  let root: Root;
  let container: HTMLElement;

  const open = async (): Promise<void> => {
    await act(async () => {
      root.render(<Profile onSignIn={onSignIn} />);
    });
  };

  const press = async (name: string): Promise<void> => {
    await act(async () => {
      container
        .querySelector<HTMLButtonElement>(`button[aria-label="${name}"]`)
        ?.click();
    });
  };

  const showYear = async (): Promise<void> => {
    await act(async () => {
      container.querySelector<HTMLInputElement>(`input[value="year"]`)?.click();
    });
  };

  /** The figure that's shown under the given name */
  const stat = (name: string): string | null | undefined =>
    [...container.querySelectorAll(`dl > div`)]
      .find((entry) => entry.querySelector(`dt`)?.textContent === name)
      ?.querySelector(`dd`)?.textContent;

  beforeEach(() => {
    vi.stubGlobal(`IS_REACT_ACT_ENVIRONMENT`, true);
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(now);
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
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it(`asks someone who hasn't signed in to do so, and asks the server nothing`, async () => {
    setPlayer(null);
    await open();
    await act(async () => {
      container.querySelector(`button`)?.click();
    });

    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(request).not.toHaveBeenCalled();
  });

  it(`says so when it can't be loaded, rather than showing an empty record`, async () => {
    // A streak of nothing would read as having lost it
    request.mockRejectedValue(new Error(`Offline`));
    await open();

    expect(container.textContent).toContain(`Couldn’t load your profile`);
    expect(container.textContent).not.toContain(`Day streak`);
  });

  it(`names the player by their handle`, async () => {
    request.mockResolvedValue(days());
    await open();

    expect(container.textContent).toContain(`@alice.test`);
  });

  it(`names a player without a handle by their identity`, async () => {
    setPlayer(bob);
    request.mockResolvedValue(days());
    await open();

    expect(container.textContent).toContain(bob.did);
  });

  it(`counts up a player's streak and solves`, async () => {
    request.mockResolvedValue(
      days([`11-05-2026`, 1], [`11-06-2026`, 2], [`11-07-2026`, 3])
    );
    await open();

    expect(stat(`Day streak`)).toBe(`3`);
    expect(stat(`Best streak`)).toBe(`3`);
    expect(stat(`Puzzles solved`)).toBe(`6`);
  });

  it(`warns a player whose streak is about to end`, async () => {
    // It's what a streak is for: this is the one reminder that they'd otherwise have no way of getting
    request.mockResolvedValue(days([`11-06-2026`, 1]));
    await open();

    expect(container.textContent).toContain(`to keep your streak`);
  });

  it(`says nothing of it once they've played today`, async () => {
    request.mockResolvedValue(days([`11-06-2026`, 1], [`11-07-2026`, 1]));
    await open();

    expect(container.textContent).not.toContain(`to keep your streak`);
  });

  it(`says nothing of it to a player with no streak`, async () => {
    request.mockResolvedValue(days([`11-01-2026`, 1]));
    await open();

    expect(container.textContent).not.toContain(`to keep your streak`);
  });

  it(`lists the latest results`, async () => {
    request.mockResolvedValue({
      days: [],
      recent: [
        { puzzle: `11-07-2026_5x5`, moves: 1, place: 2 },
        { puzzle: `11-02-2026_8x6`, moves: 40, place: 3 }
      ]
    });
    await open();

    const rows = [...container.querySelectorAll(`li`)].map(
      (row) => row.textContent
    );

    expect(rows[0]).toBe(`Today · 5×51 move2nd`);
    expect(rows[1]).toContain(`8×6`);
    expect(rows[1]).toContain(`40 moves`);
    expect(rows[1]).not.toContain(`Today`);
  });

  it(`marks today, and the days that were played, on the month`, async () => {
    request.mockResolvedValue(days([`11-05-2026`, 2]));
    await open();

    const today = container.querySelector(`td[aria-current="date"]`);
    const played = container.querySelector(`td[data-played]`);

    expect(today?.textContent).toBe(`7`);
    expect(played?.textContent).toBe(`5, 2 puzzles solved`);
  });

  it(`joins days that follow one another, so that a streak reads as one shape`, async () => {
    // The 4th to the 6th of November 2026 is a Wednesday to a Friday
    request.mockResolvedValue(
      days([`11-04-2026`, 1], [`11-05-2026`, 1], [`11-06-2026`, 1])
    );
    await open();

    const played = [...container.querySelectorAll(`td[data-played]`)];

    expect(played.map((day) => day.hasAttribute(`data-before`))).toStrictEqual([
      false,
      true,
      true
    ]);
    expect(played.map((day) => day.hasAttribute(`data-after`))).toStrictEqual([
      true,
      true,
      false
    ]);
  });

  it(`doesn't join a run from the end of one week to the start of the next`, async () => {
    // The 24th of October 2026 is a Saturday and the 25th a Sunday, which are at opposite ends of the calendar
    request.mockResolvedValue(days([`10-24-2026`, 1], [`10-25-2026`, 1]));
    await open();
    await press(`Earlier month`);

    const [saturday, sunday] = [
      ...container.querySelectorAll(`td[data-played]`)
    ];

    expect(saturday.hasAttribute(`data-after`)).toBe(false);
    expect(sunday.hasAttribute(`data-before`)).toBe(false);
  });

  it(`steps back through the months, and no further forward than today`, async () => {
    request.mockResolvedValue(days([`10-15-2026`, 1]));
    await open();

    expect(container.querySelector(`td[data-played]`)).toBeNull();
    expect(
      container.querySelector<HTMLButtonElement>(`[aria-label="Later month"]`)
        ?.disabled
    ).toBe(true);

    await press(`Earlier month`);

    expect(container.querySelector(`td[data-played]`)?.textContent).toContain(
      `15`
    );
    expect(container.querySelector(`td[aria-current="date"]`)).toBeNull();

    await press(`Later month`);

    expect(container.querySelector(`td[aria-current="date"]`)).not.toBeNull();
  });

  it(`crosses from one year into another`, async () => {
    request.mockResolvedValue(days([`12-25-2025`, 1]));
    await open();

    for (let month = 0; month < 11; month += 1) {
      // Each step depends on the one before
      // oxlint-disable-next-line no-await-in-loop
      await press(`Earlier month`);
    }

    expect(container.textContent).toContain(`2025`);
    expect(container.querySelector(`td[data-played]`)?.textContent).toContain(
      `25`
    );
  });

  it(`sums up a year`, async () => {
    request.mockResolvedValue(days([`01-01-2026`, 2], [`11-05-2026`, 3]));
    await open();
    await showYear();

    expect(container.textContent).toContain(`5 puzzles on 2 days`);
    expect(
      container
        .querySelector(`figure[aria-label^="Jan"]`)
        ?.getAttribute(`aria-label`)
    ).toContain(`2 puzzles on 1 day`);
  });

  it(`shades a day by how much of it was played`, async () => {
    request.mockResolvedValue(
      days([`01-01-2026`, 1], [`01-02-2026`, 4], [`01-03-2026`, 5])
    );
    await open();
    await showYear();

    const shades = [
      ...container.querySelectorAll(`figure[aria-label^="Jan"] i[data-level]`)
    ].map((day) => day.getAttribute(`data-level`));

    expect(shades).toStrictEqual([`1`, `2`, `3`]);
  });

  it(`steps back through the years`, async () => {
    request.mockResolvedValue(days([`06-01-2025`, 1]));
    await open();
    await showYear();

    expect(container.textContent).toContain(`0 puzzles on 0 days`);

    await press(`Earlier year`);

    expect(container.textContent).toContain(`1 puzzle on 1 day`);
  });

  it(`goes back to loading when the player changes`, async () => {
    // One player's streak would otherwise stay on show under the next one's name until theirs arrives
    request.mockImplementation(async (_path, { query }) =>
      query.player === alice.did
        ? days([`11-07-2026`, 16])
        : new Promise(() => {})
    );
    await open();
    await act(async () => {
      setPlayer(bob);
    });

    expect(container.textContent).toContain(`Loading…`);
    expect(stat(`Puzzles solved`)).toBeUndefined();
  });

  it(`never shows one player's record as another's`, async () => {
    // Accounts can be switched on a shared device, and a slow answer can arrive after the switch
    const slow = Promise.withResolvers<object>();

    request.mockImplementation(async (_path, { query }) =>
      query.player === alice.did ? slow.promise : days([`11-07-2026`, 1])
    );
    await open();
    await act(async () => {
      setPlayer(bob);
    });
    await act(async () => {
      slow.resolve(days([`11-07-2026`, 16]));
    });

    expect(stat(`Puzzles solved`)).toBe(`1`);
  });
});
