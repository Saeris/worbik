// @vitest-environment happy-dom
import {
  OAuthUserAgent,
  createAuthorizationUrl,
  deleteStoredSession,
  finalizeAuthorization,
  getSession
} from "@atcute/oauth-browser-client";
import { SUBMIT_SCORE, GET_SOLVES } from "../../utils/service";
import { REQUEST_TIMEOUT } from "../../utils/withTimeout";
import { SignedOutError, SignInError } from "../errors";
import { completeSignIn, getProof, signIn, signOut } from "../oauth";

const handle = vi.fn<(path: string) => Promise<Response>>();
const endSession = vi.fn<() => Promise<void>>();

// What looks up a player's identity holds on to `fetch` as it's imported, so this has to be in place before that
const network = vi.hoisted(() => {
  const stub = vi.fn<typeof fetch>();

  vi.stubGlobal(`fetch`, stub);

  return stub;
});

vi.mock(`@atcute/oauth-browser-client`, () => ({
  configureOAuth: vi.fn<() => void>(),
  createAuthorizationUrl: vi.fn<() => Promise<URL>>(),
  deleteStoredSession: vi.fn<() => void>(),
  finalizeAuthorization: vi.fn<() => Promise<unknown>>(),
  getSession: vi.fn<() => Promise<unknown>>(),
  OAuthUserAgent: vi.fn<() => unknown>()
}));

vi.mock(`void/client`, () => ({ fetch: vi.fn<() => Promise<unknown>>() }));

const did = `did:plc:alice`;
const assign = vi.fn<(url: URL) => void>();
const replaceState = vi.fn<History[`replaceState`]>();

/** A session on the player's server, which was granted the given methods when they signed in */
const session = (scope: string): unknown => ({ token: { scope } });

const answer = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status });

const signedInWith = (scope: string): void => {
  vi.mocked(getSession).mockResolvedValue({} as never);
  vi.mocked(OAuthUserAgent).mockImplementation(function agent(this: object) {
    Object.assign(this, {
      session: session(scope),
      handle,
      signOut: endSession
    });
  });
};

/** What some work failed with, for when time has to pass before it does */
const failureOf = async (work: Promise<unknown>): Promise<unknown> => {
  try {
    return await work;
  } catch (cause) {
    return cause;
  }
};

/** Finishes signing in with whatever the player's server remembered for us */
const returnWith = async (state: unknown): Promise<string> => {
  vi.mocked(finalizeAuthorization).mockResolvedValue({
    session: { info: { sub: `did:web:alice.test` } },
    state
  } as never);

  return (await completeSignIn()).from;
};

/** Answers a request for a player's identity document, which is where their handle is named */
const identify = (...alsoKnownAs: string[]): void => {
  network.mockResolvedValue(
    new Response(
      JSON.stringify({
        "@context": [`https://www.w3.org/ns/did/v1`],
        id: `did:web:alice.test`,
        alsoKnownAs
      }),
      { headers: { "content-type": `application/json` } }
    )
  );
};

describe(`signing in`, () => {
  beforeEach(() => {
    vi.stubGlobal(`location`, {
      protocol: `https:`,
      origin: `https://worbik.test`,
      hostname: `worbik.test`,
      pathname: `/6x6`,
      search: ``,
      hash: `#code=secret`,
      assign
    });
    vi.stubGlobal(`history`, { replaceState });
    // Nothing here is allowed to reach the network
    network.mockRejectedValue(new Error(`No network here`));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe(`signIn`, () => {
    it(`sends a player to the server that hosts their account`, async () => {
      const url = new URL(`https://pds.test/authorize`);

      vi.mocked(createAuthorizationUrl).mockResolvedValue(url);
      await signIn(`alice.test`);

      expect(assign).toHaveBeenCalledExactlyOnceWith(url);
    });

    it(`says so when what was typed can't be a handle`, async () => {
      // Better said straight away than by way of a failed trip to someone's server
      await expect(signIn(`not a handle!`)).rejects.toThrow(SignInError);
      expect(assign).not.toHaveBeenCalled();
    });

    it(`says so when nobody goes by a handle`, async () => {
      vi.mocked(createAuthorizationUrl).mockRejectedValue(new Error(`Nope`));

      await expect(signIn(`nobody.test`)).rejects.toThrow(
        `Couldn’t find an account with that handle`
      );
    });

    it(`says that Bluesky can't be reached, rather than blaming a handle that wasn't given`, async () => {
      vi.mocked(createAuthorizationUrl).mockRejectedValue(new Error(`Nope`));

      await expect(signIn()).rejects.toThrow(`Couldn’t reach Bluesky`);
    });

    it(`gives up on a server that never answers`, async () => {
      // The button stays disabled until this settles, so it has to settle
      vi.useFakeTimers();
      vi.mocked(createAuthorizationUrl).mockReturnValue(
        new Promise(() => {}) as never
      );

      const outcome = failureOf(signIn(`alice.test`));

      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT);

      await expect(outcome).resolves.toBeInstanceOf(SignInError);
    });
  });

  describe(`completeSignIn`, () => {
    it(`returns a player to the page that they left`, async () => {
      await expect(returnWith({ from: `/6x6?a=1` })).resolves.toBe(`/6x6?a=1`);
    });

    it.each([
      [`an address elsewhere`, `https://evil.test/phish`],
      // Browsers read this as an address elsewhere, despite how it begins
      [`an address that only looks like a path`, `//evil.test/phish`],
      [`a script`, `javascript:alert(1)`]
    ])(`never sends a player to %s`, async (_, from) => {
      // This comes back from outside the page, so it could be made to say anything
      await expect(returnWith({ from })).resolves.toBe(`/`);
    });

    it(`goes home when nothing was remembered`, async () => {
      await expect(returnWith(undefined)).resolves.toBe(`/`);
    });

    it(`finds the handle that a player's identity names`, async () => {
      identify(`https://elsewhere.test`, `at://alice.test`);
      vi.mocked(finalizeAuthorization).mockResolvedValue({
        session: { info: { sub: `did:web:alice.test` } }
      } as never);

      await expect(completeSignIn()).resolves.toMatchObject({
        player: { did: `did:web:alice.test`, handle: `alice.test` }
      });
    });

    it(`signs a player in without a handle when none can be found`, async () => {
      // A handle is only for show, so it's no reason to fail at the last moment
      vi.mocked(finalizeAuthorization).mockResolvedValue({
        session: { info: { sub: `did:web:alice.test` } }
      } as never);

      await expect(completeSignIn()).resolves.toMatchObject({
        player: { did: `did:web:alice.test`, handle: null }
      });
    });

    it(`takes the server's answer out of the address`, async () => {
      // It's only good once, and an address gets shared, and saved in a browser's history
      await returnWith({ from: `/` });

      expect(replaceState).toHaveBeenCalledExactlyOnceWith(null, ``, `/6x6`);
    });
  });

  describe(`getProof`, () => {
    it(`hands back what the player's server vouched for`, async () => {
      signedInWith(`atproto ${SUBMIT_SCORE}`);
      handle.mockResolvedValue(answer(200, { token: `a-token` }));

      await expect(getProof(did, SUBMIT_SCORE)).resolves.toBe(`a-token`);
    });

    it(`says that someone isn't signed in when there's no session`, async () => {
      // This is what asks them to sign in again, which nothing else would
      vi.mocked(getSession).mockRejectedValue(new Error(`No session`));

      await expect(getProof(did, SUBMIT_SCORE)).rejects.toThrow(SignedOutError);
    });

    it(`says the same of a sign-in from before a method was needed`, async () => {
      // Their server would refuse, and only signing in again can grant it
      signedInWith(`atproto ${SUBMIT_SCORE}`);

      await expect(getProof(did, GET_SOLVES)).rejects.toThrow(SignedOutError);
      expect(handle).not.toHaveBeenCalled();
    });

    it(`says the same of something that isn't an identity`, async () => {
      await expect(getProof(`alice`, SUBMIT_SCORE)).rejects.toThrow(
        SignedOutError
      );
    });

    it(`passes on why a player's server said no`, async () => {
      // Signing in again wouldn't help, so this mustn't look as if it would
      signedInWith(SUBMIT_SCORE);
      handle.mockResolvedValue(
        answer(400, { error: `BadRequest`, message: `Not today` })
      );

      const refused = getProof(did, SUBMIT_SCORE);

      await expect(refused).rejects.toThrow(`400, BadRequest: Not today`);
      await expect(refused).rejects.not.toThrow(SignedOutError);
    });

    it(`copes with a refusal that doesn't explain itself`, async () => {
      signedInWith(SUBMIT_SCORE);
      handle.mockResolvedValue(new Response(`<html>`, { status: 502 }));

      await expect(getProof(did, SUBMIT_SCORE)).rejects.toThrow(`(502)`);
    });

    it(`gives up on a server that never answers`, async () => {
      // A player would otherwise watch "Posting your score…" for good
      vi.useFakeTimers();
      signedInWith(SUBMIT_SCORE);
      handle.mockReturnValue(new Promise(() => {}));

      const outcome = failureOf(getProof(did, SUBMIT_SCORE));

      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT);

      await expect(outcome).resolves.toStrictEqual(
        new Error(`No answer came in time`)
      );
    });
  });

  describe(`signOut`, () => {
    it(`tells the player's server`, async () => {
      signedInWith(SUBMIT_SCORE);
      await signOut(did);

      expect(endSession).toHaveBeenCalledTimes(1);
    });

    it(`forgets the session here when their server can't be told`, async () => {
      // Being signed out here matters more, on a device that someone else may pick up
      signedInWith(SUBMIT_SCORE);
      endSession.mockRejectedValue(new Error(`Offline`));
      await signOut(did);

      expect(deleteStoredSession).toHaveBeenCalledExactlyOnceWith(did);
    });

    it(`does the same when their server never answers`, async () => {
      vi.useFakeTimers();
      signedInWith(SUBMIT_SCORE);
      endSession.mockReturnValue(new Promise(() => {}));

      const finished = signOut(did);

      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT);
      await finished;

      expect(deleteStoredSession).toHaveBeenCalledExactlyOnceWith(did);
    });
  });
});
