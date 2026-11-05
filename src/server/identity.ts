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
import { isHandle } from "@atcute/lexicons/syntax";
import { ServiceJwtVerifier } from "@atcute/xrpc-server/auth";

/**
 * The one thing that a player's proof of identity may be used for.
 *
 * Under `temp` because none of this is settled: these names are placeholders
 * until Worbik's lexicons are published under a domain of their own.
 */
export const SUBMIT_SCORE: Nsid = `gg.saeris.worbik.temp.submitScore`;

/**
 * The longest that a proof may be valid for: five minutes, plus room for
 * the clock of the server that issued it running ahead of this one's.
 */
const MAX_TOKEN_SECONDS = 5 * 60 + 30;

/** The identity of this service, which is the did:web of wherever it is served from */
export const serviceDid = (origin: string): Did<"web"> =>
  `did:web:${new URL(origin).host.replaceAll(`:`, `%3A`)}`;

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
 * Tokens aren't tracked to stop one from being used twice, as the only thing
 * one can do is submit a score, and a player's first score is the one kept.
 *
 * Throws when the request doesn't prove who the player is.
 */
export const verifyPlayer = async (
  request: Request,
  { didResolver = didDocuments }: Resolvers = {}
): Promise<Did> => {
  const verifier = new ServiceJwtVerifier({
    acceptAudiences: [serviceDid(request.url)],
    maxAge: MAX_TOKEN_SECONDS,
    resolver: didResolver
  });
  const { issuer } = await verifier.verifyRequest(request, {
    lxm: SUBMIT_SCORE
  });

  return issuer;
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
