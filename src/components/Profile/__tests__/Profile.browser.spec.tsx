import { http, HttpResponse } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import { body, neverHappens } from "#test/game";
import { network } from "#test/network";
import { Profile } from "../Profile";

/** Midday on the 7th of November, when that day's puzzles are the ones being played */
const now = new Date(`2026-11-07T12:00:00Z`);
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const bob = { did: `did:plc:bob`, handle: null } as const;

const days = (...entries: [string, number][]): object => ({
  days: entries.map(([day, solved]) => ({ day, solved })),
  recent: []
});

/** Answers with what a player has done, or by the given means for anyone else */
const serve = (
  history: object | (() => Response | Promise<Response>)
): void => {
  network.use(
    http.get(`*/api/profile`, async () =>
      typeof history === `function` ? history() : HttpResponse.json(history)
    )
  );
};

describe(`profile`, () => {
  const onSignIn = vi.fn<() => void>();

  const open = async (): Promise<void> => {
    await render(<Profile onSignIn={onSignIn} />);
  };

  const press = async (name: string): Promise<void> => {
    await page.getByRole(`button`, { name }).click();
  };

  const showYear = async (): Promise<void> => {
    await page.getByRole(`radio`, { name: `Year` }).click({ force: true });
  };

  const says = async (words: string): Promise<void> => {
    await expect.element(body).toMatchTextContent(words);
  };

  /** The figure that's shown under the given name */
  const stat = (name: string): string | null | undefined =>
    [...document.querySelectorAll(`dl > div`)]
      .find((entry) => entry.querySelector(`dt`)?.textContent === name)
      ?.querySelector(`dd`)?.textContent;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: [`Date`] });
    vi.setSystemTime(now);
    setPlayer(alice);
  });

  it(`asks someone who hasn't signed in to do so, and asks the server nothing`, async () => {
    let asked = false;

    serve(() => {
      asked = true;

      return HttpResponse.json(days());
    });
    setPlayer(null);
    await open();
    await press(`Sign in`);

    expect(onSignIn).toHaveBeenCalledTimes(1);
    expect(asked).toBe(false);
  });

  it(`says so when it can't be loaded, rather than showing an empty record`, async () => {
    // A streak of nothing would read as having lost it
    serve(() => HttpResponse.error());
    await open();

    await says(`Couldn’t load your profile`);
    await expect.element(body).not.toMatchTextContent(`Day streak`);
  });

  it(`names the player by their handle`, async () => {
    serve(days());
    await open();

    await says(`@alice.test`);
  });

  it(`names a player without a handle by their identity`, async () => {
    setPlayer(bob);
    serve(days());
    await open();

    await says(bob.did);
  });

  it(`counts up a player's streak and solves`, async () => {
    serve(days([`11-05-2026`, 1], [`11-06-2026`, 2], [`11-07-2026`, 3]));
    await open();

    await expect.poll(() => stat(`Day streak`)).toBe(`3`);
    expect(stat(`Best streak`)).toBe(`3`);
    expect(stat(`Puzzles solved`)).toBe(`6`);
  });

  it(`warns a player whose streak is about to end`, async () => {
    // It's what a streak is for: this is the one reminder that they'd otherwise have no way of getting
    serve(days([`11-06-2026`, 1]));
    await open();

    await says(`to keep your streak`);
  });

  it(`says nothing of it once they've played today`, async () => {
    serve(days([`11-06-2026`, 1], [`11-07-2026`, 1]));
    await open();

    await says(`Day streak`);
    await expect.element(body).not.toMatchTextContent(`to keep your streak`);
  });

  it(`says nothing of it to a player with no streak`, async () => {
    serve(days([`11-01-2026`, 1]));
    await open();

    await says(`Day streak`);
    await expect.element(body).not.toMatchTextContent(`to keep your streak`);
  });

  it(`lists the latest results`, async () => {
    serve({
      days: [],
      recent: [
        { puzzle: `11-07-2026_5x5`, moves: 1, place: 2 },
        { puzzle: `11-02-2026_8x6`, moves: 40, place: 3 }
      ]
    });
    await open();
    await says(`Recent`);

    const rows = [...document.querySelectorAll(`li`)].map(
      (row) => row.textContent
    );

    expect(rows[0]).toBe(`Today · 5×51 move2nd`);
    expect(rows[1]).toContain(`8×6`);
    expect(rows[1]).toContain(`40 moves`);
    expect(rows[1]).not.toContain(`Today`);
  });

  it(`marks today, and the days that were played, on the month`, async () => {
    serve(days([`11-05-2026`, 2]));
    await open();
    await says(`Day streak`);

    expect(document.querySelector(`td[aria-current="date"]`)?.textContent).toBe(
      `7`
    );
    expect(document.querySelector(`td[data-played]`)?.textContent).toBe(
      `5, 2 puzzles solved`
    );
  });

  it(`joins days that follow one another, so that a streak reads as one shape`, async () => {
    // The 4th to the 6th of November 2026 is a Wednesday to a Friday
    serve(days([`11-04-2026`, 1], [`11-05-2026`, 1], [`11-06-2026`, 1]));
    await open();
    await says(`Day streak`);

    const played = [...document.querySelectorAll(`td[data-played]`)];

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
    serve(days([`10-24-2026`, 1], [`10-25-2026`, 1]));
    await open();
    await press(`Earlier month`);
    await says(`October 2026`);

    const [saturday, sunday] = [
      ...document.querySelectorAll(`td[data-played]`)
    ];

    expect(saturday.hasAttribute(`data-after`)).toBe(false);
    expect(sunday.hasAttribute(`data-before`)).toBe(false);
  });

  it(`steps back through the months, and no further forward than today`, async () => {
    serve(days([`10-15-2026`, 1]));
    await open();
    await says(`Day streak`);

    expect(document.querySelector(`td[data-played]`)).toBeNull();
    await expect
      .element(page.getByRole(`button`, { name: `Later month` }))
      .toBeDisabled();

    await press(`Earlier month`);
    await says(`October 2026`);

    expect(document.querySelector(`td[data-played]`)?.textContent).toContain(
      `15`
    );
    expect(document.querySelector(`td[aria-current="date"]`)).toBeNull();

    await press(`Later month`);
    await says(`November 2026`);

    expect(document.querySelector(`td[aria-current="date"]`)).not.toBeNull();
  });

  it(`crosses from one year into another`, async () => {
    serve(days([`12-25-2025`, 1]));
    await open();

    for (let month = 0; month < 11; month += 1) {
      // Each step depends on the one before
      // oxlint-disable-next-line no-await-in-loop
      await press(`Earlier month`);
    }

    await says(`December 2025`);
    expect(document.querySelector(`td[data-played]`)?.textContent).toContain(
      `25`
    );
  });

  it(`sums up a year`, async () => {
    serve(days([`01-01-2026`, 2], [`11-05-2026`, 3]));
    await open();
    await showYear();

    await says(`5 puzzles on 2 days`);
    expect(
      document
        .querySelector(`figure[aria-label^="Jan"]`)
        ?.getAttribute(`aria-label`)
    ).toContain(`2 puzzles on 1 day`);
  });

  it(`shades a day by how much of it was played`, async () => {
    serve(days([`01-01-2026`, 1], [`01-02-2026`, 4], [`01-03-2026`, 5]));
    await open();
    await showYear();
    await says(`10 puzzles on 3 days`);

    const shades = [
      ...document.querySelectorAll(`figure[aria-label^="Jan"] i[data-level]`)
    ].map((day) => day.getAttribute(`data-level`));

    expect(shades).toStrictEqual([`1`, `2`, `3`]);
  });

  it(`steps back through the years`, async () => {
    serve(days([`06-01-2025`, 1]));
    await open();
    await showYear();

    await says(`0 puzzles on 0 days`);

    await press(`Earlier year`);

    await says(`1 puzzle on 1 day`);
  });

  it(`goes back to loading when the player changes`, async () => {
    // One player's streak would otherwise stay on show under the next one's name until theirs arrives
    network.use(
      http.get(`*/api/profile`, async ({ request }) =>
        new URL(request.url).searchParams.get(`player`) === alice.did
          ? HttpResponse.json(days([`11-07-2026`, 16]))
          : new Promise<Response>(() => {})
      )
    );
    await open();
    await expect.poll(() => stat(`Puzzles solved`)).toBe(`16`);
    setPlayer(bob);

    await says(`Loading…`);
    expect(stat(`Puzzles solved`)).toBeUndefined();
  });

  it(`never shows one player's record as another's`, async () => {
    // Accounts can be switched on a shared device, and a slow answer can arrive after the switch
    const slow = Promise.withResolvers<undefined>();

    network.use(
      http.get(`*/api/profile`, async ({ request }) => {
        if (new URL(request.url).searchParams.get(`player`) === alice.did) {
          await slow.promise;

          return HttpResponse.json(days([`11-07-2026`, 16]));
        }

        return HttpResponse.json(days([`11-07-2026`, 1]));
      })
    );
    await open();
    setPlayer(bob);
    await expect.poll(() => stat(`Puzzles solved`)).toBe(`1`);
    slow.resolve(undefined);

    await neverHappens(() => stat(`Puzzles solved`) !== `1`);
  });
});
