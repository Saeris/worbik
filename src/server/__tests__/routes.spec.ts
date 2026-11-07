import type { Nsid } from "@atcute/lexicons";
import { http, HttpResponse } from "msw";
import { db } from "void/db";
import { server } from "#test/server";
import { scores } from "../../db/schema";
import { DELETE } from "../../routes/api/account";
import { GET as getCard } from "../../routes/api/card";
import { GET as check } from "../../routes/api/check";
import { GET as getHandle } from "../../routes/api/handle";
import { GET as getProfile } from "../../routes/api/profile";
import { GET as getRanking } from "../../routes/api/ranking";
import { GET as getScores, POST as postScore } from "../../routes/api/scores";
import {
  GET as listSolves,
  POST as fetchSolves
} from "../../routes/api/solves";
import { GET as getMetadata } from "../../routes/oauth/client-metadata.json";
import { GET as getSitemap } from "../../routes/sitemap.xml";
import { MAX_MOVES } from "../../state";
import { getPuzzleID } from "../../utils/getPuzzleID";
import { DELETE_DATA, GET_SOLVES, SUBMIT_SCORE } from "../../utils/service";
import { createPlayer, keepPuzzle, send, type createTestDb } from "./harness";

vi.mock(`void/db`, async (importOriginal) => {
  const { createTestDb: create } = await import(`./harness`);

  return { ...(await importOriginal<object>()), db: create() };
});

vi.mock(`void/kv`, async () => ({ kv: (await import(`./harness`)).kv }));

const puzzle = getPuzzleID();
const [day] = puzzle.split(`_`);
const alice = `did:plc:aaaaaaaaaaaaaaaaaaaaaaaa`;
const bob = `did:plc:bbbbbbbbbbbbbbbbbbbbbbbb`;

/** A board that takes two moves to solve: both of its rows are rotated once */
const solution = `abcdefghijklmnopqrstuvwxy`;
const start = `eabcdjfghiklmnopqrstuvwxy`;
const middle = `abcdejfghiklmnopqrstuvwxy`;

const seed = async (did: string, moves: number = 10): Promise<void> => {
  await db.insert(scores).values({
    puzzle,
    did,
    handle: null,
    moves,
    createdAt: new Date(1000)
  });
};

const post = (
  body: object,
  headers: Record<string, string> = {}
): RequestInit => ({
  method: `POST`,
  body: JSON.stringify(body),
  headers: { "content-type": `application/json`, ...headers }
});

describe(`routes`, () => {
  /** What a player's server would hand them, good for one method and nothing else */
  let proof: (did: string, method: Nsid) => Promise<Record<string, string>>;

  beforeEach(async () => {
    keepPuzzle(puzzle, [2, start, solution]);

    const players: Record<string, Awaited<ReturnType<typeof createPlayer>>> = {
      [alice]: await createPlayer(alice, `alice.test`),
      [bob]: await createPlayer(bob, `bob.test`)
    };

    proof = async (did, method) => players[did].proof(method);
  });

  afterEach(() => {
    (db as unknown as ReturnType<typeof createTestDb>).clear();
    vi.clearAllMocks();
  });

  describe(`dELETE /api/account`, () => {
    it(`deletes the scores of whoever proves that they're asking`, async () => {
      await seed(alice);

      const response = await send(DELETE, `/api/account`, {
        method: `DELETE`,
        headers: await proof(alice, DELETE_DATA)
      });

      expect(response.status).toBe(200);
      await expect(
        (await send(getScores, `/api/scores?puzzle=${puzzle}`)).json()
      ).resolves.toStrictEqual([]);
    });

    it.each([
      [`no proof at all`, null],
      // A proof is good for one method, so one that a game was posted with can't be turned to this
      [`a proof that's good for something else`, SUBMIT_SCORE]
    ])(`keeps everything when given %s`, async (_, method) => {
      const headers = method ? await proof(alice, method) : {};

      await seed(alice);

      const response = await send(DELETE, `/api/account`, {
        method: `DELETE`,
        headers
      });

      expect(response.status).toBe(401);
      await expect(
        (await send(getScores, `/api/scores?puzzle=${puzzle}`)).json()
      ).resolves.toHaveLength(1);
    });

    it(`only ever reaches the player who proved it`, async () => {
      await seed(alice);
      await seed(bob);

      await send(DELETE, `/api/account`, {
        method: `DELETE`,
        headers: await proof(bob, DELETE_DATA)
      });

      await expect(
        (await send(getScores, `/api/scores?puzzle=${puzzle}`)).json()
      ).resolves.toMatchObject([{ did: alice }]);
    });
  });

  describe(`/api/solves`, () => {
    it(`tells anyone what a player has posted, and nothing of the solutions`, async () => {
      // A device asks this every time the game is opened, so it mustn't need a trip to a player's server
      await seed(alice);

      const response = await send(
        listSolves,
        `/api/solves?player=${alice}&day=${day}`
      );
      const body = await response.text();

      expect(JSON.parse(body)).toStrictEqual([{ puzzle, moves: 10 }]);
      expect(body).not.toContain(solution);
    });

    it(`gives solutions only to the player who proves that they're asking`, async () => {
      await seed(alice);

      const response = await send(
        fetchSolves,
        `/api/solves`,
        post({ day }, await proof(alice, GET_SOLVES))
      );

      await expect(response.json()).resolves.toMatchObject([{ solution }]);
    });

    it.each([
      [`no proof at all`, null],
      [`a proof that's good for something else`, SUBMIT_SCORE]
    ])(`keeps solutions to itself when given %s`, async (_, method) => {
      const headers = method ? await proof(alice, method) : {};

      // Leaderboards name who has solved a puzzle, so this would otherwise hand the day's answers to anyone
      await seed(alice);

      const response = await send(
        fetchSolves,
        `/api/solves`,
        post({ day }, headers)
      );

      expect(response.status).toBe(401);
      await expect(response.text()).resolves.not.toContain(solution);
    });

    it(`gives a player their own games, whoever they say they are`, async () => {
      await seed(alice);

      const response = await send(
        fetchSolves,
        `/api/solves`,
        post({ day, player: alice }, await proof(bob, GET_SOLVES))
      );

      await expect(response.json()).resolves.toStrictEqual([]);
    });

    it(`turns away a day that isn't one`, async () => {
      const response = await send(
        listSolves,
        `/api/solves?player=${alice}&day=${`1`.repeat(50)}`
      );

      expect(response.status).toBe(400);
    });
  });

  describe(`pOST /api/scores`, () => {
    const game = { puzzle, history: [start, middle, solution] };

    it(`posts a game under the name of whoever proved that they played it`, async () => {
      const response = await send(
        postScore,
        `/api/scores`,
        post({ ...game, did: bob }, await proof(alice, SUBMIT_SCORE))
      );

      await expect(response.json()).resolves.toMatchObject({
        did: alice,
        handle: `alice.test`,
        moves: 2
      });
    });

    it.each([
      [`no proof at all`, null],
      [`a proof that's good for something else`, GET_SOLVES]
    ])(`posts nothing when given %s`, async (_, method) => {
      const headers = method ? await proof(alice, method) : {};

      const response = await send(
        postScore,
        `/api/scores`,
        post(game, headers)
      );

      expect(response.status).toBe(401);
      await expect(
        (await send(getScores, `/api/scores?puzzle=${puzzle}`)).json()
      ).resolves.toStrictEqual([]);
    });

    it.each([
      [`has no moves`, { puzzle, history: [start] }],
      [
        `is longer than any game can be`,
        { puzzle, history: Array.from({ length: MAX_MOVES + 2 }, () => start) }
      ],
      [
        `has boards too big to be one`,
        { puzzle, history: [start, `a`.repeat(65)] }
      ]
    ])(`turns away a game that %s`, async (_, body) => {
      // Replaying a game is the most that a request can cost, so what's replayed has a limit
      const response = await send(
        postScore,
        `/api/scores`,
        post(body, await proof(alice, SUBMIT_SCORE))
      );

      expect(response.status).toBe(400);
    });
  });

  describe(`reading scores`, () => {
    it(`keeps the shape of /api/scores, for tabs that were opened before /api/ranking`, async () => {
      await seed(alice);

      const response = await send(getScores, `/api/scores?puzzle=${puzzle}`);

      await expect(response.json()).resolves.toMatchObject([{ did: alice }]);
    });

    it(`says where a player stands on /api/ranking`, async () => {
      await seed(bob, 5);
      await seed(alice, 10);

      const response = await send(
        getRanking,
        `/api/ranking?puzzle=${puzzle}&player=${alice}`
      );

      await expect(response.json()).resolves.toMatchObject({
        total: 2,
        you: { did: alice, place: 2 }
      });
    });

    it(`has anyone's profile, as it's all public already`, async () => {
      await seed(alice);

      const response = await send(getProfile, `/api/profile?player=${alice}`);

      await expect(response.json()).resolves.toMatchObject({
        recent: [{ puzzle, moves: 10, place: 1 }]
      });
    });

    it(`turns away a profile for something that isn't an identity`, async () => {
      const response = await send(getProfile, `/api/profile?player=alice`);

      expect(response.status).toBe(400);
    });
  });

  describe(`gET /api/check`, () => {
    const path = `/api/check?puzzle=${puzzle}&guesses=${middle}`;

    it(`answers the game itself`, async () => {
      const response = await send(check, path, {
        headers: { "sec-fetch-site": `same-origin` }
      });

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toMatchObject({
        hints: [expect.stringContaining(`ABCDE`)]
      });
    });

    it(`turns away another website`, async () => {
      const response = await send(check, path, {
        headers: { "sec-fetch-site": `cross-site` }
      });

      expect(response.status).toBe(403);
    });

    it(`answers what isn't a browser, which can claim anything anyway`, async () => {
      // What keeps guesses honest is that each has to be a real move, so this mustn't be what's relied on
      const response = await send(check, path);

      expect(response.status).toBe(200);
    });

    it(`says so when there's no such puzzle`, async () => {
      const response = await send(
        check,
        `/api/check?puzzle=01-01-2020_5x5&guesses=${middle}`
      );

      expect(response.status).toBe(404);
    });

    it(`won't say anything about a guess that isn't a move`, async () => {
      // Answering any guess would read a puzzle's solution out, a letter at a time
      const response = await send(
        check,
        `/api/check?puzzle=${puzzle}&guesses=${solution}`
      );

      expect(response.status).toBe(409);
      await expect(response.text()).resolves.not.toContain(solution);
    });
  });

  describe(`gET /api/handle`, () => {
    it(`finds a player however their handle was typed`, async () => {
      // Phones capitalize what's typed, and handles aren't case sensitive
      const response = await send(getHandle, `/api/handle?handle=Alice.Test`);

      await expect(response.json()).resolves.toStrictEqual({ did: alice });
    });

    it(`says so when nobody goes by a handle`, async () => {
      server.use(
        http.get(`https://nobody.test/.well-known/atproto-did`, () =>
          HttpResponse.text(`Not found`, { status: 404 })
        )
      );

      const response = await send(getHandle, `/api/handle?handle=nobody.test`);

      expect(response.status).toBe(404);
    });

    it(`turns away something too long to be a handle`, async () => {
      // This fetches from elsewhere for anyone who asks, so it has to be asked something reasonable
      const response = await send(
        getHandle,
        `/api/handle?handle=${`a`.repeat(254)}`
      );

      expect(response.status).toBe(400);
    });
  });

  describe(`gET /api/card`, () => {
    it(`draws a picture`, async () => {
      const response = await send(getCard, `/api/card?puzzle=${puzzle}`);
      const bytes = new Uint8Array(await response.arrayBuffer());

      expect(response.headers.get(`content-type`)).toBe(`image/png`);
      // Every PNG begins with these, so this is a picture and not a message that says otherwise
      expect(new TextDecoder().decode(bytes.slice(1, 4))).toBe(`PNG`);
    });

    it(`lets a card be kept for good once it can't change`, async () => {
      // A card is the most expensive thing to draw, so one that's kept is one that isn't drawn again
      await seed(alice);

      const response = await send(
        getCard,
        `/api/card?puzzle=${puzzle}&player=${alice}`
      );

      expect(response.headers.get(`cache-control`)).toContain(`immutable`);
    });

    it(`doesn't let a card be kept when its player may yet post a score`, async () => {
      // A link that's shared before a score lands would otherwise go on showing no score for good
      const response = await send(
        getCard,
        `/api/card?puzzle=${puzzle}&player=${alice}`
      );

      expect(response.headers.get(`cache-control`)).toBe(`public, max-age=300`);
    });

    it(`says so when there's no such puzzle`, async () => {
      const response = await send(getCard, `/api/card?puzzle=01-01-2020_5x5`);

      expect(response.status).toBe(404);
    });
  });

  describe(`what Worbik says about itself`, () => {
    it(`describes the app at whichever address it's served from`, async () => {
      // A player's server fetches this to learn who is asking, and only sends them back to where it says
      const response = await send(getMetadata, `/oauth/client-metadata.json`);

      await expect(response.json()).resolves.toMatchObject({
        client_id: `https://worbik.test/oauth/client-metadata.json`,
        redirect_uris: [`https://worbik.test/oauth/callback`]
      });
    });

    it(`asks for each of the methods that it uses`, async () => {
      // One that's missing can't be used by anyone, as a player's server wouldn't vouch for it
      const response = await send(getMetadata, `/oauth/client-metadata.json`);
      const metadata = await response.text();

      for (const method of [SUBMIT_SCORE, GET_SOLVES, DELETE_DATA]) {
        expect(metadata).toContain(method);
      }
    });

    it(`lists the game's pages as XML`, async () => {
      const response = await send(getSitemap, `/sitemap.xml`);

      expect(response.headers.get(`content-type`)).toContain(`application/xml`);
      await expect(response.text()).resolves.toContain(
        `https://worbik.test/6x6`
      );
    });
  });
});
