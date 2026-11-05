import type { Random } from "./randomInt";

/**
 * Creates a deterministic random number generator from a seed string, such
 * that the same seed always yields the same sequence of numbers.
 *
 * The seed is hashed with SHA-256 so that similar seeds (e.g. consecutive
 * dates) produce unrelated sequences, and the first 128 bits of the digest
 * initialize an [sfc32](https://pracrand.sourceforge.net/RNG_engines.txt)
 * generator.
 */
export const seededRandom = async (seed: string): Promise<Random> => {
  let [a, b, c, d] = new Uint32Array(
    await crypto.subtle.digest(`SHA-256`, new TextEncoder().encode(seed))
  );

  /* eslint-disable no-bitwise */
  return () => {
    const t = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    c = (c + t) | 0;
    return (t >>> 0) / 2 ** 32;
  };
  /* eslint-enable no-bitwise */
};
