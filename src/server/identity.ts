import {
  CompositeDidDocumentResolver,
  CompositeHandleResolver,
  DohJsonHandleResolver,
  PlcDidDocumentResolver,
  WebDidDocumentResolver,
  WellKnownHandleResolver,
  type DidDocumentResolver,
  type HandleResolver
} from "@atcute/identity-resolver";
import type { Did, Nsid } from "@atcute/lexicons";
import { isHandle, type AtprotoDid } from "@atcute/lexicons/syntax";
import { ServiceJwtVerifier } from "@atcute/xrpc-server/auth";
import {
  DELETE_DATA,
  GET_SOLVES,
  serviceDid,
  SUBMIT_SCORE
} from "#utils/service";

export { DELETE_DATA, GET_SOLVES, serviceDid, SUBMIT_SCORE };

/**
 * The longest that a proof may be valid for: five minutes, plus room for
 * the clock of the server that issued it running ahead of this one's.
 */
const MAX_TOKEN_SECONDS = 5 * 60 + 30;

const didDocuments: DidDocumentResolver = new CompositeDidDocumentResolver({
  methods: {
    plc: new PlcDidDocumentResolver(),
    web: new WebDidDocumentResolver()
  }
});

/** Resolves handles over DNS-over-HTTPS and `.well-known`, which is everything that a Worker is able to do */
const handles: HandleResolver = new CompositeHandleResolver({
  methods: {
    dns: new DohJsonHandleResolver({
      dohUrl: `https://cloudflare-dns.com/dns-query`
    }),
    http: new WellKnownHandleResolver()
  }
});

export interface Resolvers {
  readonly didResolver?: DidDocumentResolver;
  readonly handleResolver?: HandleResolver;
}

/**
 * Works out who is making a request, from the proof of identity it carries.
 *
 * A player never signs in to Worbik itself. Instead, the server that hosts
 * their account vouches for them: it signs a short-lived token which says
 * "this is them, addressed to you, for this one purpose". That is checked
 * against the key in the player's own identity document, so it can't be
 * forged by anyone but the server that the player trusts with their account.
 *
 * Each token is good for one method. They aren't tracked to stop one from
 * being used twice, as a player's first score is the one kept, and a player
 * is only ever shown their own games.
 *
 * Throws when the request doesn't prove who the player is.
 */
export const verifyPlayer = async (
  request: Request,
  lxm: Nsid,
  { didResolver = didDocuments }: Resolvers = {}
): Promise<Did> => {
  const verifier = new ServiceJwtVerifier({
    acceptAudiences: [serviceDid(request.url)],
    maxAge: MAX_TOKEN_SECONDS,
    resolver: didResolver
  });
  const { issuer } = await verifier.verifyRequest(request, { lxm });

  return issuer;
};

/**
 * Looks up the identity of the player who goes by the given handle, or
 * `null` if there is no such player.
 *
 * A browser can't look this up for itself, as it has no way to query DNS,
 * which is where most handles point to their owner from.
 */
export const resolveDid = async (
  handle: string,
  { handleResolver = handles }: Resolvers = {}
): Promise<AtprotoDid | null> => {
  if (!isHandle(handle)) return null;

  try {
    return await handleResolver.resolve(handle);
  } catch {
    return null;
  }
};

/**
 * Looks up the handle that a player goes by, or `null` if they don't have
 * one that can be confirmed.
 *
 * An identity document can name any handle it likes, so the handle is only
 * taken to be the player's if it points back at them in turn. Otherwise a
 * player could put themselves on a leaderboard under someone else's name.
 */
export const resolveHandle = async (
  did: Did,
  { didResolver = didDocuments, handleResolver = handles }: Resolvers = {}
): Promise<string | null> => {
  try {
    const { alsoKnownAs = [] } = await didResolver.resolve(did);
    const handle = alsoKnownAs
      .find((alias) => alias.startsWith(`at://`))
      ?.slice(`at://`.length);

    if (!handle || !isHandle(handle)) return null;

    return (await handleResolver.resolve(handle)) === did ? handle : null;
  } catch {
    // A handle is only for show, so not being able to look one up is no reason to turn a score away
    return null;
  }
};
