import { delay, http, HttpResponse } from "msw";
import { page } from "vite-plus/test/browser";
import { render } from "vitest-browser-react";
import { setPlayer } from "#auth/player";
import { body } from "#test/game";
import { network } from "#test/network";
import { Leaderboard } from "../Leaderboard";

const puzzle = `11-07-2026_5x5`;
const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const someone = (index: number): object => ({
  did: `did:plc:player${index}`,
  handle: `player${index}.test`,
  moves: index + 1
});
const ranking = (total: number, you: object | null = null): object => ({
  scores: Array.from({ length: Math.min(total, 100) }, (_, index) =>
    someone(index)
  ),
  total,
  you
});

/** Answers with a leaderboard for each puzzle that the test knows of, and fails for any other */
const serve = (rankings: Record<string, object | Promise<object>>): void => {
  network.use(
    http.get(`*/api/ranking`, async ({ request }) => {
      const answer =
        await rankings[new URL(request.url).searchParams.get(`puzzle`) ?? ``];

      return answer ? HttpResponse.json(answer) : HttpResponse.error();
    })
  );
};

describe(`leaderboard`, () => {
  const onSignIn = vi.fn<() => void>();

  const open = async (): Promise<void> => {
    await render(
      <Leaderboard puzzleID={puzzle} width={5} height={5} onSignIn={onSignIn} />
    );
  };

  const press = async (name: string): Promise<void> => {
    await page.getByRole(`button`, { name }).click();
  };

  const pick = async (size: string): Promise<void> => {
    await page.getByLabelText(`Board size`).selectOptions(size);
  };

  const says = async (words: string): Promise<void> => {
    await expect.element(body).toMatchTextContent(words);
  };

  it(`lists who solved the puzzle`, async () => {
    serve({ [puzzle]: ranking(2) });
    await open();

    await says(`player0.test`);
    await says(`2 players posted a score.`);
  });

  it(`gets one player right`, async () => {
    serve({ [puzzle]: ranking(1) });
    await open();

    await says(`1 player posted a score.`);
  });

  it(`says how many more there are than it lists`, async () => {
    // "100 players" would be wrong, and would have someone in 150th place wondering where they went
    serve({ [puzzle]: ranking(150) });
    await open();

    await says(`150 players posted a score, and the top 100 are listed.`);
  });

  it(`shows a player where they stand beyond the end of the list`, async () => {
    setPlayer(alice);
    serve({ [puzzle]: ranking(150, { ...alice, moves: 500, place: 150 }) });
    await open();

    await says(`alice.test`);
    expect(document.querySelectorAll(`li`)).toHaveLength(101);
  });

  it(`doesn't list a player twice when they're among those listed`, async () => {
    const mine = { ...alice, moves: 1 };

    setPlayer(alice);
    serve({
      [puzzle]: { scores: [mine], total: 1, you: { ...mine, place: 1 } }
    });
    await open();

    await says(`alice.test`);
    expect(document.querySelectorAll(`li`)).toHaveLength(1);
  });

  it(`invites the first solve of today's puzzle`, async () => {
    serve({ [puzzle]: ranking(0) });
    await open();

    await says(`Be the first to solve today’s 5×5`);
  });

  it(`doesn't invite anyone to solve a day that's over`, async () => {
    serve({ [puzzle]: ranking(1), "11-06-2026_5x5": ranking(0) });
    await open();
    await press(`Earlier day`);

    await says(`Nobody posted a score`);
    await expect.element(body).not.toMatchTextContent(`Be the first`);
  });

  it(`says so when scores can't be loaded, rather than that there are none`, async () => {
    serve({});
    await open();

    await says(`Couldn’t load these scores`);
    await expect.element(body).not.toMatchTextContent(`No scores yet`);
  });

  it(`steps back through the days, and forward again`, async () => {
    serve({ [puzzle]: ranking(1), "11-06-2026_5x5": ranking(3) });
    await open();
    await press(`Earlier day`);

    await says(`3 players`);

    await press(`Later day`);

    await says(`Today`);
    await says(`1 player`);
  });

  it(`stops at today`, async () => {
    // There are no scores to come, and a later puzzle would be one that's yet to be played
    serve({ [puzzle]: ranking(1) });
    await open();

    await expect
      .element(page.getByRole(`button`, { name: `Later day` }))
      .toBeDisabled();
  });

  it(`has a leaderboard for every size of board`, async () => {
    serve({ [puzzle]: ranking(1), "11-07-2026_8x6": ranking(7) });
    await open();
    await pick(`8x6`);

    await says(`7 players`);
  });

  it(`says where the player stands on each one`, async () => {
    // Without saying who is asking, the server can't say where they place
    setPlayer(alice);
    network.use(
      http.get(`*/api/ranking`, ({ request }) =>
        HttpResponse.json(
          ranking(
            150,
            new URL(request.url).searchParams.get(`player`)
              ? { ...alice, moves: 500, place: 150 }
              : null
          )
        )
      )
    );
    await open();

    await says(`alice.test`);
  });

  it(`never shows a slow answer in place of a later choice`, async () => {
    // Scores for the wrong board, under the label of the right one, would be read as the truth
    const slow = Promise.withResolvers<object>();

    serve({ [puzzle]: slow.promise, "11-07-2026_8x6": ranking(7) });
    await open();
    await pick(`8x6`);
    await says(`7 players`);
    slow.resolve(ranking(1));
    await delay(50);

    await says(`7 players`);
  });

  it(`goes back to loading while another board's scores are on their way`, async () => {
    // These scores would otherwise stay on show under the label of a board that they aren't for
    serve({
      [puzzle]: ranking(2),
      "11-07-2026_8x6": new Promise(() => {})
    });
    await open();
    await says(`2 players`);
    await pick(`8x6`);

    await says(`Loading…`);
    await expect.element(body).not.toMatchTextContent(`2 players`);
  });

  it(`offers signing in to someone who hasn't`, async () => {
    serve({ [puzzle]: ranking(1) });
    await open();
    await press(`Sign in to post scores`);

    expect(onSignIn).toHaveBeenCalledTimes(1);
  });

  it(`doesn't offer it to someone who has`, async () => {
    setPlayer(alice);
    serve({ [puzzle]: ranking(1) });
    await open();

    await says(`1 player`);
    await expect.element(body).not.toMatchTextContent(`Sign in to post scores`);
  });
});
