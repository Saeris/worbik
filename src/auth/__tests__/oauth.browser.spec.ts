import { http, HttpResponse } from "msw";
import { stopAnswering } from "#test/game";
import { carol, PDS } from "#test/handlers";
import { network } from "#test/network";
import { arriveFromServer, signInAs } from "#test/session";
import { navigation } from "#utils/navigation";
import { GET_SOLVES, SUBMIT_SCORE } from "#utils/service";
import { REQUEST_TIMEOUT } from "#utils/withTimeout";
import { SignedOutError, SignInError } from "../errors";
import { completeSignIn, getProof, signIn, signOut } from "../oauth";

const alice = { did: `did:plc:alice`, handle: `alice.test` } as const;
const proofRoute = `${PDS}/xrpc/com.atproto.server.getServiceAuth`;

/** What some work failed with, for when time has to pass before it does */
const failureOf = async (work: Promise<unknown>): Promise<unknown> => {
  try {
    return await work;
  } catch (cause) {
    return cause;
  }
};

/** Lets time pass for whatever is waiting on a server that won't answer */
const timeOut = async (): Promise<void> => {
  await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT);
};

/** Has a player's identity name the given things, which needn't be a handle */
const identifiedAs = (...alsoKnownAs: string[]): void => {
  network.use(
    http.get(`https://plc.directory/*`, () =>
      HttpResponse.json({
        "@context": [`https://www.w3.org/ns/did/v1`],
        id: carol.did,
        alsoKnownAs,
        service: [
          {
            id: `#atproto_pds`,
            type: `AtprotoPersonalDataServer`,
            serviceEndpoint: PDS
          }
        ]
      })
    )
  );
};

/** Comes back from a player's server, with what was left behind on setting off */
const returnWith = async (
  state: unknown
): Promise<Awaited<ReturnType<typeof completeSignIn>>> => {
  await arriveFromServer(state);

  return completeSignIn();
};

describe(`signing in`, () => {
  afterEach(() => {
    history.replaceState(null, ``, location.pathname + location.search);
  });

  describe(`signIn`, () => {
    it(`sends a player to the server that hosts their account`, async () => {
      const leave = vi.spyOn(navigation, `assign`).mockReturnValue();

      await signIn(carol.handle);

      const [url] = leave.mock.calls[0];

      expect(String(url)).toContain(`${PDS}/oauth/authorize`);
      expect(String(url)).toContain(`request_uri=urn%3Arequest`);
    });

    it(`says so when what was typed can't be a handle`, async () => {
      // Better said straight away than by way of a failed trip to someone's server
      const leave = vi.spyOn(navigation, `assign`).mockReturnValue();

      await expect(signIn(`not a handle!`)).rejects.toThrow(
        `That doesn’t look like a handle`
      );
      expect(leave).not.toHaveBeenCalled();
    });

    it(`says so when nobody goes by a handle`, async () => {
      await expect(signIn(`nobody.test`)).rejects.toThrow(
        `Couldn’t find an account with that handle`
      );
    });

    it(`says that Bluesky can't be reached, rather than blaming a handle that wasn't given`, async () => {
      network.use(
        http.get(`https://bsky.social/*`, () => HttpResponse.error())
      );

      await expect(signIn()).rejects.toThrow(`Couldn’t reach Bluesky`);
    });

    it(`gives up on a server that never answers`, async () => {
      // The button stays disabled until this settles, so it has to settle
      network.use(
        http.get(`${PDS}/.well-known/oauth-protected-resource`, stopAnswering())
      );
      vi.useFakeTimers({ toFake: [`setTimeout`, `clearTimeout`] });

      const outcome = failureOf(signIn(carol.handle));

      await timeOut();

      await expect(outcome).resolves.toBeInstanceOf(SignInError);
    });
  });

  describe(`completeSignIn`, () => {
    it(`returns a player to the page that they left`, async () => {
      const { from } = await returnWith({ from: `/6x6?a=1` });

      expect(from).toBe(`/6x6?a=1`);
    });

    it.each([
      [`an address elsewhere`, `https://evil.test/phish`],
      // Browsers read this as an address elsewhere, despite how it begins
      [`an address that only looks like a path`, `//evil.test/phish`],
      [`a script`, `javascript:alert(1)`]
    ])(`never sends a player to %s`, async (_, from) => {
      // This comes back from outside the page, so it could be made to say anything
      await expect(returnWith({ from })).resolves.toMatchObject({ from: `/` });
    });

    it(`goes home when nothing was remembered`, async () => {
      await expect(returnWith(null)).resolves.toMatchObject({ from: `/` });
    });

    it(`says who the player is, as their server does`, async () => {
      const { player } = await returnWith({ from: `/` });

      expect(player).toStrictEqual(carol);
    });

    it(`signs a player in without a handle when their identity names none`, async () => {
      // A handle is only for show, so it's no reason to fail at the last moment
      identifiedAs(`https://elsewhere.test`);

      const { player } = await returnWith({ from: `/` });

      expect(player).toStrictEqual({ did: carol.did, handle: null });
    });

    it(`picks out their handle from whatever else their identity names`, async () => {
      identifiedAs(`https://elsewhere.test`, `at://${carol.handle}`);

      const { player } = await returnWith({ from: `/` });

      expect(player).toStrictEqual(carol);
    });

    it(`takes the server's answer out of the address`, async () => {
      // It's only good once, and an address gets shared, and saved in a browser's history
      await returnWith({ from: `/` });

      expect(location.hash).toBe(``);
    });

    it(`leaves a player signed in, and able to prove it`, async () => {
      await returnWith({ from: `/` });

      await expect(getProof(carol.did, SUBMIT_SCORE)).resolves.toBe(
        `proof-of-${SUBMIT_SCORE}`
      );
    });
  });

  describe(`getProof`, () => {
    it(`hands back what the player's server vouched for`, async () => {
      await signInAs(alice);

      await expect(getProof(alice.did, SUBMIT_SCORE)).resolves.toBe(
        `proof-of-${SUBMIT_SCORE}`
      );
    });

    it(`says that someone isn't signed in when there's no session`, async () => {
      // This is what asks them to sign in again, which nothing else would
      await expect(getProof(alice.did, SUBMIT_SCORE)).rejects.toThrow(
        SignedOutError
      );
    });

    it(`says the same of a sign-in from before a method was needed`, async () => {
      // Their server would refuse, and only signing in again can grant it
      await signInAs(alice, `atproto ${SUBMIT_SCORE}`);

      await expect(getProof(alice.did, GET_SOLVES)).rejects.toThrow(
        SignedOutError
      );
    });

    it(`says the same of something that isn't an identity`, async () => {
      await expect(getProof(`alice`, SUBMIT_SCORE)).rejects.toThrow(
        SignedOutError
      );
    });

    it(`passes on why a player's server said no`, async () => {
      // Signing in again wouldn't help, so this mustn't look as if it would
      network.use(
        http.get(proofRoute, () =>
          HttpResponse.json(
            { error: `BadRequest`, message: `Not today` },
            { status: 400 }
          )
        )
      );
      await signInAs(alice);

      const failure = await failureOf(getProof(alice.did, SUBMIT_SCORE));

      expect(failure).not.toBeInstanceOf(SignedOutError);
      expect(failure).toStrictEqual(
        expect.objectContaining({
          message: expect.stringContaining(`400, BadRequest: Not today`)
        })
      );
    });

    it(`copes with a refusal that doesn't explain itself`, async () => {
      network.use(
        http.get(proofRoute, () => HttpResponse.text(`<html>`, { status: 502 }))
      );
      await signInAs(alice);

      await expect(getProof(alice.did, SUBMIT_SCORE)).rejects.toThrow(`(502)`);
    });

    it(`gives up on a server that never answers`, async () => {
      // A player would otherwise watch "Posting your score…" for good
      network.use(http.get(proofRoute, stopAnswering()));
      await signInAs(alice);
      vi.useFakeTimers({ toFake: [`setTimeout`, `clearTimeout`] });

      const outcome = failureOf(getProof(alice.did, SUBMIT_SCORE));

      await timeOut();

      await expect(outcome).resolves.toStrictEqual(
        new Error(`No answer came in time`)
      );
    });
  });

  describe(`signOut`, () => {
    it(`tells the player's server, and leaves nothing to sign in with`, async () => {
      const told = vi.fn<() => void>();

      network.use(
        http.post(`${PDS}/oauth/revoke`, () => {
          told();

          return HttpResponse.json({});
        })
      );
      await signInAs(alice);
      await signOut(alice.did);

      expect(told).toHaveBeenCalledTimes(1);
      await expect(getProof(alice.did, SUBMIT_SCORE)).rejects.toThrow(
        SignedOutError
      );
    });

    it(`forgets the session here when their server can't be told`, async () => {
      // Being signed out here matters more, on a device that someone else may pick up
      network.use(http.post(`${PDS}/oauth/revoke`, () => HttpResponse.error()));
      await signInAs(alice);
      await signOut(alice.did);

      await expect(getProof(alice.did, SUBMIT_SCORE)).rejects.toThrow(
        SignedOutError
      );
    });

    it(`does the same when their server never answers`, async () => {
      network.use(http.post(`${PDS}/oauth/revoke`, stopAnswering()));
      await signInAs(alice);
      vi.useFakeTimers({ toFake: [`setTimeout`, `clearTimeout`] });

      const finished = signOut(alice.did);

      await timeOut();
      await finished;
      vi.useRealTimers();

      await expect(getProof(alice.did, SUBMIT_SCORE)).rejects.toThrow(
        SignedOutError
      );
    });
  });
});
