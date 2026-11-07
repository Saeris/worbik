/** Tidies up a handle as a player might type or paste it, e.g. `@Name.Example.com ` */
export const normalizeHandle = (handle: string): string =>
  handle.trim().replace(/^@/u, ``).toLowerCase();
