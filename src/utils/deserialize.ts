import { group } from "./group";

export const deserialize = ({ s, c }: { s: string; c: number }): string[][] =>
  group(s.split(``), c);
