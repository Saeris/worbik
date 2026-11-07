import { http, HttpResponse, type RequestHandler } from "msw";
import { OAUTH_SCOPE } from "#utils/service";

/** Which identity a request to the directory of them is for, as they're asked for in an encoded form */
export const getRequestedDid = ({ url }: { url: string }): string =>
  decodeURIComponent(new URL(url).pathname.slice(1));

/** Where a test's player has their account */
export const PDS = `https://pds.test`;

/** A player whose identity can be looked up, as signing in has to */
export const carol = {
  did: `did:plc:aaaaaaaaaaaaaaaaaaaaaaaa`,
  handle: `carol.test`
} as const;

const authorizationServer = {
  issuer: PDS,
  authorization_endpoint: `${PDS}/oauth/authorize`,
  token_endpoint: `${PDS}/oauth/token`,
  pushed_authorization_request_endpoint: `${PDS}/oauth/par`,
  revocation_endpoint: `${PDS}/oauth/revoke`,
  client_id_metadata_document_supported: true,
  response_types_supported: [`code`]
};

/**
 * What the network answers with when a test has nothing particular to say
 * about it: Worbik's own routes, as they answer for a day that nobody has
 * played, and a server that hosts accounts and speaks OAuth. Worbik's own
 * code and the library that signs players in both run for real against
 * these. A test that cares puts handlers of its own in front of them.
 */
export const handlers: RequestHandler[] = [
  http.get(`*/api/ranking`, () =>
    HttpResponse.json({ scores: [], total: 0, you: null })
  ),
  http.get(`*/api/solves`, () => HttpResponse.json([])),
  // Bluesky's directory, which suggests handles as they're typed
  http.get(`https://public.api.bsky.app/*`, () =>
    HttpResponse.json({ actors: [] })
  ),
  http.get(`*/api/handle`, ({ request }) =>
    new URL(request.url).searchParams.get(`handle`) === carol.handle
      ? HttpResponse.json({ did: carol.did })
      : HttpResponse.json({ message: `Nobody` }, { status: 404 })
  ),
  http.get(`https://plc.directory/*`, ({ request }) =>
    getRequestedDid(request) !== carol.did
      ? HttpResponse.json({ message: `Nobody` }, { status: 404 })
      : HttpResponse.json({
          "@context": [`https://www.w3.org/ns/did/v1`],
          id: carol.did,
          alsoKnownAs: [`at://${carol.handle}`],
          service: [
            {
              id: `#atproto_pds`,
              type: `AtprotoPersonalDataServer`,
              serviceEndpoint: PDS
            }
          ]
        })
  ),
  http.get(`${PDS}/.well-known/oauth-protected-resource`, () =>
    HttpResponse.json({ resource: PDS, authorization_servers: [PDS] })
  ),
  http.get(`${PDS}/.well-known/oauth-authorization-server`, () =>
    HttpResponse.json(authorizationServer)
  ),
  http.post(`${PDS}/oauth/par`, () =>
    HttpResponse.json({ request_uri: `urn:request`, expires_in: 60 })
  ),
  http.post(`${PDS}/oauth/token`, () =>
    HttpResponse.json({
      sub: carol.did,
      scope: OAUTH_SCOPE,
      token_type: `DPoP`,
      access_token: `access`,
      refresh_token: `refresh`,
      expires_in: 3600
    })
  ),
  http.post(`${PDS}/oauth/revoke`, () => HttpResponse.json({})),
  // Vouches for whoever asks, with a token that says what it's good for
  http.get(`${PDS}/xrpc/com.atproto.server.getServiceAuth`, ({ request }) =>
    HttpResponse.json({
      token: `proof-of-${new URL(request.url).searchParams.get(`lxm`)}`
    })
  )
];
