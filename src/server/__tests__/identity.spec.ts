import { P256PrivateKeyExportable } from "@atcute/crypto";
import type {
  DidDocumentResolver,
  HandleResolver
} from "@atcute/identity-resolver";
import type { Did } from "@atcute/lexicons";
import { createServiceJwt } from "@atcute/xrpc-server/auth";
import {
  resolveDid,
  resolveHandle,
  serviceDid,
  SUBMIT_SCORE,
  verifyPlayer
} from "../identity";

const origin = `https://worbik.test`;
const alice: Did = `did:plc:alice`;
const mallory: Did = `did:plc:mallory`;

type DidDocument = Awaited<ReturnType<DidDocumentResolver["resolve"]>>;

/** An identity document like the one a player's account publishes, holding the key their server signs with */
const documentFor = async (
  did: Did,
  key: P256PrivateKeyExportable,
  handle?: string
): Promise<DidDocument> => ({
  "@context": [`https://www.w3.org/ns/did/v1`],
  id: did,
  alsoKnownAs: handle ? [`at://${handle}`] : [],
  verificationMethod: [
    {
      id: `${did}#atproto`,
      type: `Multikey`,
      controller: did,
      publicKeyMultibase: await key.exportPublicKey(`multikey`)
    }
  ]
});

/** Stands in for looking up identity documents over the network */
const resolverOf = (
  documents: Record<string, DidDocument>
): DidDocumentResolver => ({
  resolve: async (did) => {
    const document = documents[did];
    if (!document) throw new Error(`No such identity: ${did}`);
    return document;
  }
});

/** Stands in for looking up over the network which identity a handle belongs to */
const handlesOf = (owners: Record<string, Did>): HandleResolver => ({
  resolve: async (handle) => {
    const owner = owners[handle];
    if (!owner) throw new Error(`No such handle: ${handle}`);
    return owner as Awaited<ReturnType<HandleResolver["resolve"]>>;
  }
});

const requestWith = (token?: string): Request =>
  new Request(`${origin}/api/scores`, {
    method: `POST`,
    headers: token ? { authorization: `Bearer ${token}` } : {}
  });

describe(`verifyPlayer`, () => {
  let key: P256PrivateKeyExportable;
  let didResolver: DidDocumentResolver;

  /** A proof like the one a player's server issues, with anything about it able to be changed */
  const proof = async (
    overrides: Partial<Parameters<typeof createServiceJwt>[0]> = {}
  ): Promise<string> =>
    createServiceJwt({
      keypair: key,
      issuer: alice,
      audience: serviceDid(origin),
      lxm: SUBMIT_SCORE,
      ...overrides
    });

  beforeAll(async () => {
    key = await P256PrivateKeyExportable.createKeypair();
    didResolver = resolverOf({ [alice]: await documentFor(alice, key) });
  });

  it(`identifies the player that a proof was issued for`, async () => {
    await expect(
      verifyPlayer(requestWith(await proof()), { didResolver })
    ).resolves.toBe(alice);
  });

  it(`rejects a request that carries no proof`, async () => {
    await expect(
      verifyPlayer(requestWith(), { didResolver })
    ).rejects.toThrow();
  });

  it(`rejects a proof that wasn't signed by the player's own server`, async () => {
    // Anyone can write a token that claims to be from someone else, but not sign it with their key
    const forged = await proof({
      keypair: await P256PrivateKeyExportable.createKeypair()
    });

    await expect(
      verifyPlayer(requestWith(forged), { didResolver })
    ).rejects.toThrow();
  });

  it(`rejects a proof that was addressed to a different service`, async () => {
    // Otherwise a token that a player gave to some other app could be used to submit scores as them
    const misaddressed = await proof({ audience: `did:web:elsewhere.test` });

    await expect(
      verifyPlayer(requestWith(misaddressed), { didResolver })
    ).rejects.toThrow();
  });

  it(`rejects a proof that was issued for a different purpose`, async () => {
    const repurposed = await proof({
      lxm: `gg.saeris.worbik.temp.somethingElse`
    });

    await expect(
      verifyPlayer(requestWith(repurposed), { didResolver })
    ).rejects.toThrow();
  });

  it(`rejects a proof that has expired`, async () => {
    const expired = await proof({
      issuedAt: Date.now() / 1000 - 60 * 60,
      expiresIn: 60
    });

    await expect(
      verifyPlayer(requestWith(expired), { didResolver })
    ).rejects.toThrow();
  });
});

describe(`resolveHandle`, () => {
  let key: P256PrivateKeyExportable;

  beforeAll(async () => {
    key = await P256PrivateKeyExportable.createKeypair();
  });

  it(`finds the handle that a player goes by`, async () => {
    await expect(
      resolveHandle(alice, {
        didResolver: resolverOf({
          [alice]: await documentFor(alice, key, `alice.test`)
        }),
        handleResolver: handlesOf({ "alice.test": alice })
      })
    ).resolves.toBe(`alice.test`);
  });

  it(`doesn't take a player's word for a handle that belongs to someone else`, async () => {
    // Otherwise a player could appear on a leaderboard under another person's name
    await expect(
      resolveHandle(mallory, {
        didResolver: resolverOf({
          [mallory]: await documentFor(mallory, key, `alice.test`)
        }),
        handleResolver: handlesOf({ "alice.test": alice })
      })
    ).resolves.toBeNull();
  });

  it(`does without a handle when one can't be looked up`, async () => {
    // A score is still worth recording for a player whose handle is unknown
    await expect(
      resolveHandle(alice, {
        didResolver: resolverOf({ [alice]: await documentFor(alice, key) }),
        handleResolver: handlesOf({})
      })
    ).resolves.toBeNull();
    await expect(
      resolveHandle(alice, {
        didResolver: resolverOf({}),
        handleResolver: handlesOf({})
      })
    ).resolves.toBeNull();
    await expect(
      resolveHandle(alice, {
        didResolver: resolverOf({
          [alice]: await documentFor(alice, key, `alice.test`)
        }),
        handleResolver: handlesOf({})
      })
    ).resolves.toBeNull();
  });
});

describe(`resolveDid`, () => {
  const handleResolver = handlesOf({ "alice.test": alice });

  it(`finds the player who goes by a handle`, async () => {
    await expect(resolveDid(`alice.test`, { handleResolver })).resolves.toBe(
      alice
    );
  });

  it(`finds nobody for a handle that no account goes by`, async () => {
    // Signing in reports this to the player as a handle to check, rather than as a fault
    await expect(
      resolveDid(`nobody.test`, { handleResolver })
    ).resolves.toBeNull();
  });

  it(`doesn't look up anything that isn't a handle`, async () => {
    // Whatever is typed into the sign-in box ends up here, and only a handle is worth a lookup
    const resolve = vi.fn<HandleResolver["resolve"]>();

    await expect(
      resolveDid(`not a handle`, { handleResolver: { resolve } })
    ).resolves.toBeNull();
    expect(resolve).not.toHaveBeenCalled();
  });
});
