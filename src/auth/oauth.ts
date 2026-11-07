import {
  CompositeDidDocumentResolver,
  LocalActorResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  type HandleResolver
} from "@atcute/identity-resolver";
import type { Did, Nsid } from "@atcute/lexicons";
import {
  isActorIdentifier,
  isDid,
  isHandle,
  type AtprotoDid
} from "@atcute/lexicons/syntax";
import {
  OAuthUserAgent,
  configureOAuth,
  createAuthorizationUrl,
  deleteStoredSession,
  finalizeAuthorization,
  getSession
} from "@atcute/oauth-browser-client";
import * as v from "valibot";
import { fetch } from "void/client";
import {
  OAUTH_CALLBACK,
  OAUTH_CLIENT_METADATA,
  OAUTH_SCOPE,
  serviceDid
} from "#utils/service";
import { SignedOutError, SignInError } from "./errors";
import { normalizeHandle } from "./handle";
import type { Player } from "./player";

/**
 * Signing in, for the browser.
 *
 * Worbik has no accounts of its own. A player signs in with the account
 * they already have elsewhere in the Atmosphere, on the server that hosts
 * it, and that server tells Worbik who they are. All of it happens between
 * the browser and that server: Worbik's own server is never given anything
 * that could be used to act as the player.
 */

/** The server that hosts the accounts of most players, for those who would rather not type their handle */
const BLUESKY = `https://bsky.social`;

/** What is remembered across the trip to the player's server and back */
const signInState = v.object({
  /** The page that the player was on, to return them to */
  from: v.string()
});

/** What the server that hosts a player's account answers with, when asked to vouch for them */
const proof = v.object({ token: v.string() });

/** How that server explains itself when it won't */
const refusal = v.object({
  error: v.string(),
  message: v.optional(v.string())
});

const didDocuments = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(),
    web: new WebDidDocumentResolver()
  }
});

/** A browser can't query DNS, which is where most handles are resolved from, so Worbik's server does it */
const handles: HandleResolver = {
  resolve: async (handle) => {
    const { did } = await fetch(`/api/handle`, { query: { handle } });
    return did;
  }
};

/**
 * How Worbik identifies itself to a player's server: by the address of a
 * document that describes it. There is no such address during development,
 * for which the protocol sets aside one that describes the app in itself.
 */
const getClientID = (redirect: string): string =>
  location.protocol === `https:`
    ? `${location.origin}${OAUTH_CLIENT_METADATA}`
    : `http://localhost?${new URLSearchParams({ redirect_uri: redirect, scope: OAUTH_SCOPE }).toString()}`;

let configured = false;

const configure = (): void => {
  if (configured) return;

  // During development a player can only be sent back to an IP address, and what is kept for their return isn't shared with `localhost`. The page moves itself there as it loads, so this is only reached if that was prevented.
  if (location.hostname === `localhost`) {
    throw new SignInError(
      `Signing in doesn’t work from “localhost”. Open this page at 127.0.0.1 instead.`
    );
  }

  const redirect = `${location.origin}${OAUTH_CALLBACK}`;

  configureOAuth({
    metadata: { client_id: getClientID(redirect), redirect_uri: redirect },
    identityResolver: new LocalActorResolver({
      handleResolver: handles,
      didDocumentResolver: didDocuments
    })
  });
  configured = true;
};

/**
 * Sends the player to the server that hosts their account, to approve
 * signing in. They are found by their handle, or sent to Bluesky's server
 * to say who they are there when no handle is given.
 *
 * This leaves the page, so nothing comes after it. It throws if the handle
 * isn't one, or if there is no account that goes by it.
 */
export const signIn = async (handle?: string): Promise<void> => {
  const identifier = handle === undefined ? null : normalizeHandle(handle);

  if (identifier !== null && !isActorIdentifier(identifier)) {
    throw new SignInError(
      `That doesn’t look like a handle. One looks like “name.bsky.social”.`
    );
  }

  configure();

  let url: URL;

  try {
    url = await createAuthorizationUrl({
      target:
        identifier === null
          ? { type: `pds`, serviceUrl: BLUESKY }
          : { type: `account`, identifier },
      scope: OAUTH_SCOPE,
      state: {
        from: location.pathname + location.search
      } satisfies v.InferOutput<typeof signInState>
    });
  } catch {
    throw new SignInError(
      identifier === null
        ? `Couldn’t reach Bluesky. Try again in a moment.`
        : `Couldn’t find an account with that handle. Check it and try again.`
    );
  }

  // What was just stored for the player's return has to be written before the page is left
  await new Promise((resolve) => {
    setTimeout(resolve, 200);
  });

  location.assign(url);
};

/** Whether an identity is of a kind that the Atmosphere uses, and so can be looked up */
const isResolvable = (did: Did): did is AtprotoDid =>
  did.startsWith(`did:plc:`) || did.startsWith(`did:web:`);

/** The handle that a player's identity names, which is shown to them but isn't relied upon for anything */
const getHandle = async (did: Did): Promise<string | null> => {
  try {
    if (!isResolvable(did)) return null;

    const { alsoKnownAs = [] } = await didDocuments.resolve(did);
    const handle = alsoKnownAs
      .find((alias) => alias.startsWith(`at://`))
      ?.slice(`at://`.length);

    return handle && isHandle(handle) ? handle : null;
  } catch {
    return null;
  }
};

/**
 * Finishes signing in, on the page that the player's server sends them back
 * to. Returns who they are, and the page that they left from.
 */
export const completeSignIn = async (): Promise<{
  player: Player;
  from: string;
}> => {
  configure();

  // The server's answer arrives in the fragment of the address, and is removed from it so that it can't be used a second time
  const params = new URLSearchParams(location.hash.slice(1));
  history.replaceState(null, ``, location.pathname + location.search);

  const { session, state } = await finalizeAuthorization(params);
  const did = session.info.sub;
  const { from } = v.parse(v.fallback(signInState, { from: `/` }), state);

  return {
    player: { did, handle: await getHandle(did) },
    // Only ever a path within Worbik, so that signing in can't be made to send a player elsewhere
    from: from.startsWith(`/`) && !from.startsWith(`//`) ? from : `/`
  };
};

/**
 * Asks the server that hosts a player's account to vouch for them: a token
 * which says who they are, addressed to Worbik, that is good for one method
 * and nothing else, for about a minute.
 *
 * Throws a `SignedOutError` if the player is no longer signed in, or signed
 * in before Worbik had any need of that method.
 */
export const getProof = async (did: string, lxm: Nsid): Promise<string> => {
  if (!isDid(did)) throw new SignedOutError();

  configure();

  let agent: OAuthUserAgent;

  try {
    // Renews the player's session first, if it has run out
    agent = new OAuthUserAgent(await getSession(did));
  } catch {
    throw new SignedOutError();
  }

  if (!agent.session.token.scope.includes(lxm)) throw new SignedOutError();

  const response = await agent.handle(
    `/xrpc/com.atproto.server.getServiceAuth?${new URLSearchParams({
      aud: serviceDid(location.origin),
      lxm
    }).toString()}`
  );

  if (!response.ok) {
    // What the server said, which is the only clue to why it said no
    const said = v.safeParse(refusal, await response.json().catch(() => null));

    throw new Error(
      `Your account’s server declined to vouch for you (${response.status}${said.success ? `, ${said.output.error}: ${said.output.message ?? ``}` : ``})`
    );
  }

  return v.parse(proof, await response.json()).token;
};

/** Signs the player out, here and on the server that hosts their account */
export const signOut = async (did: string): Promise<void> => {
  if (!isDid(did)) return;

  configure();

  try {
    await new OAuthUserAgent(
      await getSession(did, { allowStale: true })
    ).signOut();
  } catch {
    // Being signed out here matters more than being able to tell the server about it
    deleteStoredSession(did);
  }
};
