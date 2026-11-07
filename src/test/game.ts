import { HTTPException } from "hono/http-exception";
import {
  http,
  HttpResponse,
  type StrictRequest,
  type DefaultBodyType
} from "msw";
import { page, type Locator } from "vite-plus/test/browser";
import { checkGuesses } from "#server/moves";
import type { Challenge } from "#state";
import { network } from "./network";

/** Everything on the page, for what isn't worth finding one element at a time */
export const body = page.elementLocator(document.body);

/**
 * Waits for a sheet to come to rest. A click on something that's still moving
 * gets it scrolled into view first, and scrolling a sheet is how it's dismissed,
 * which would take away what was about to be clicked.
 */
export const comesToRest = async (sheet: Locator): Promise<void> => {
  const position = (): number => sheet.element().getBoundingClientRect().top;

  await expect
    .poll(async () => {
      const before = position();

      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);

      return position() === before;
    })
    .toBe(true);
};

/**
 * Confirms that something doesn't happen. Checking once would pass in the
 * moment before it did, so this gives it the time that it would have taken.
 */
export const neverHappens = async (happened: () => boolean): Promise<void> => {
  await expect(
    vi.waitFor(
      () => {
        if (!happened()) throw new Error(`Not yet`);
      },
      { timeout: 150, interval: 10 }
    )
  ).rejects.toThrow(`Not yet`);
};

/**
 * Holds a request for as long as the test lasts, like a server that has stopped
 * answering. It's let go of at the end, as requests to a player's server wait in
 * line for the one before, which would otherwise hold up the next test.
 */
export const stopAnswering = (): (() => Promise<Response>) => {
  const held = Promise.withResolvers<undefined>();

  onTestFinished(() => {
    held.resolve(undefined);
  });

  return async () => {
    await held.promise;

    return HttpResponse.json({});
  };
};

/** Answers a request to `/api/check` as the real server does, by running the real server's code */
export const answerCheck = async (
  puzzle: string,
  challenge: Challenge,
  request: StrictRequest<DefaultBodyType>
): Promise<Response> => {
  const { searchParams } = new URL(request.url);

  try {
    return HttpResponse.json(
      await checkGuesses(
        puzzle,
        challenge,
        (searchParams.get(`guesses`) ?? ``).split(`,`),
        searchParams.get(`from`) ?? undefined
      )
    );
  } catch (cause) {
    return HttpResponse.json(
      { message: `Refused` },
      { status: cause instanceof HTTPException ? cause.status : 500 }
    );
  }
};

/**
 * Has `/api/check` answer for a game as the real server does. Returns what it
 * has been asked so far, for the few tests that are about how many requests
 * are made.
 */
export const serveGame = (puzzle: string, challenge: Challenge): string[][] => {
  const asked: string[][] = [];

  network.use(
    http.get(`*/api/check`, async ({ request }) => {
      asked.push(
        (new URL(request.url).searchParams.get(`guesses`) ?? ``).split(`,`)
      );

      return answerCheck(puzzle, challenge, request);
    })
  );

  return asked;
};
