import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { join } from "node:path";
import { P256PrivateKeyExportable } from "@atcute/crypto";
import type { Did, Nsid } from "@atcute/lexicons";
import { createServiceJwt } from "@atcute/xrpc-server/auth";
import { Hono, type Context } from "hono";
import { http, HttpResponse } from "msw";
import { createDb } from "void/db";
import type { Challenge } from "#state";
import { getRequestedDid } from "#test/handlers";
import { server } from "#test/server";
import { serviceDid } from "#utils/service";

/**
 * What tests of the server run against: the real D1 driver, with the real
 * migrations applied, over an SQLite database that lives in memory. Queries
 * are what most of the server is, so these run for real. A mock could only
 * repeat what a test already believes they do.
 */

const migrations = join(import.meta.dirname, `../../db/migrations`);

/** Stands in for a D1 binding. Only as much of one as the driver uses. */
const toBinding = (sqlite: DatabaseSync): Parameters<typeof createDb>[0] => {
  const prepare = (query: string, params: SQLInputValue[] = []): unknown => ({
    bind: (...values: SQLInputValue[]) => prepare(query, values),
    all: async () => ({
      results: sqlite.prepare(query).all(...params),
      success: true,
      meta: {}
    }),
    raw: async () =>
      sqlite
        .prepare(query)
        .all(...params)
        .map((row) => Object.values(row as object)),
    run: async () => ({
      results: [],
      success: true,
      meta: sqlite.prepare(query).run(...params)
    })
  });
  const binding = { prepare, withSession: () => binding };

  return binding as unknown as Parameters<typeof createDb>[0];
};

/** A database with nothing in it, as a fresh deployment would have */
export const createTestDb = (): ReturnType<typeof createDb> & {
  /** Removes everything from the database, so that no test depends on the one before */
  clear: () => void;
} => {
  const sqlite = new DatabaseSync(`:memory:`);

  for (const file of readdirSync(migrations).toSorted()) {
    if (file.endsWith(`.sql`)) {
      sqlite.exec(
        readFileSync(join(migrations, file), `utf8`).replaceAll(
          `--> statement-breakpoint`,
          ``
        )
      );
    }
  }

  return Object.assign(createDb(toBinding(sqlite)), {
    clear: () => {
      sqlite.exec(`DELETE FROM scores`);
    }
  });
};

/** A route's handler, which is given a request's context and answers in whatever way it likes */
type Handler = (c: Context) => unknown;

/**
 * Sends a request through a route's handler, its validators included, the
 * way that a Worker would.
 */
export const send = async (
  handler: Handler,
  path: string,
  init?: RequestInit
): Promise<Response> => {
  const app = new Hono();

  app.all(`*`, async (c) => {
    const answer = await handler(c);

    return answer instanceof Response ? answer : c.json(answer as object);
  });

  return app.request(`https://worbik.test${path}`, init);
};

/** What's kept in KV, which a test can put puzzles into */
const puzzles = new Map<string, Challenge>();

/** Stands in for `void/kv`, as a Worker's bindings don't exist outside of one */
export const kv = {
  map: () => ({
    get: async (key: string) => puzzles.get(key) ?? null,
    put: async (key: string, value: Challenge) => {
      puzzles.set(key, value);
    }
  })
};

/** Puts a puzzle in place, as if it had been made and kept */
export const keepPuzzle = (id: string, challenge: Challenge): void => {
  puzzles.set(id, challenge);
};

/** Where tests send their requests, which is who a proof has to be addressed to */
const ORIGIN = `https://worbik.test`;

/** Everyone whose identity can be looked up, by that identity */
const documents = new Map<string, object>();

/**
 * Gives a player an identity that can be looked up, with a key that their
 * server signs with and a handle that points back at them, the same way as
 * they would be found out in the world. Returns a way to prove who they are,
 * which is checked for real.
 */
export const createPlayer = async (
  did: Did,
  handle: string
): Promise<{ proof: (method: Nsid) => Promise<Record<string, string>> }> => {
  const key = await P256PrivateKeyExportable.createKeypair();

  documents.set(did, {
    "@context": [`https://www.w3.org/ns/did/v1`],
    id: did,
    alsoKnownAs: [`at://${handle}`],
    verificationMethod: [
      {
        id: `${did}#atproto`,
        type: `Multikey`,
        controller: did,
        publicKeyMultibase: await key.exportPublicKey(`multikey`)
      }
    ]
  });

  server.use(
    http.get(`https://plc.directory/*`, ({ request }) => {
      const found = documents.get(getRequestedDid(request));

      return found
        ? HttpResponse.json(found)
        : HttpResponse.json({ message: `Nobody` }, { status: 404 });
    }),
    http.get(`https://${handle}/.well-known/atproto-did`, () =>
      HttpResponse.text(did)
    ),
    http.get(`https://cloudflare-dns.com/dns-query`, () =>
      HttpResponse.json({ Status: 3 })
    )
  );

  return {
    proof: async (lxm) => ({
      authorization: `Bearer ${await createServiceJwt({
        keypair: key,
        issuer: did,
        audience: serviceDid(ORIGIN),
        lxm
      })}`
    })
  };
};
