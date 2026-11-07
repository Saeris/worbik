import { readdirSync, readFileSync } from "node:fs";
import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import { join } from "node:path";
import { Hono, type Context } from "hono";
import { createDb } from "void/db";

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
