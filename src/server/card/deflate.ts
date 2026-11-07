/**
 * Compresses bytes into the format that a PNG keeps its pixels in (zlib),
 * doing only the one thing that pays for a picture made of flat shapes:
 * replacing runs of the same byte with a note of how long each run is.
 *
 * The runtime has a compressor of its own that makes smaller files, but it
 * looks for every kind of repetition, and that search is most of the
 * processor time that a Worker on the free plan is allowed for a request.
 * This reads the bytes once, and leaves a file a few times larger.
 */

/* eslint-disable no-bitwise */

/** Reverses the lowest `length` bits of a code, as codes are written from their highest bit, into a stream that fills from its lowest */
const reverse = (code: number, length: number): number => {
  let reversed = 0;

  for (let bit = 0; bit < length; bit++) {
    reversed = (reversed << 1) | ((code >> bit) & 1);
  }

  return reversed;
};

/**
 * The code for each byte, and how many bits long it is, from the table of
 * codes that the format has built in. Using that table saves working one
 * out, and sending it along.
 */
const LITERAL_CODES = Uint16Array.from({ length: 256 }, (_, byte) =>
  byte < 144 ? reverse(0x30 + byte, 8) : reverse(0x190 + byte - 144, 9)
);

/** The longest run that a single note can stand for */
const MAX_RUN = 258;

/** The shortest run that is worth a note, rather than writing its bytes out */
const MIN_RUN = 3;

/** The lengths at which each of the format's codes for a run begins, and how many further bits pick a length out of its range */
const RUN_BASES = [
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67,
  83, 99, 115, 131, 163, 195, 227, 258
];
const RUN_EXTRA = [
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5,
  5, 5, 0
];

/**
 * Everything that is written for a run of each length, and how many bits
 * it comes to: the code for its length, any bits that pick the length out
 * of that code's range, and the five empty bits that say the run repeats
 * the byte just before it.
 */
const RUNS = Array.from({ length: MAX_RUN + 1 }, (_, length) => {
  if (length < MIN_RUN) return { bits: 0, size: 0 };

  const index = RUN_BASES.findLastIndex((base) => base <= length);
  // The first 23 codes for a run are seven bits long, and the rest are eight
  const [code, size] =
    index < 23
      ? [reverse(index + 1, 7), 7]
      : [reverse(0xc0 + index - 23, 8), 8];

  return {
    bits: code | ((length - RUN_BASES[index]) << size),
    size: size + RUN_EXTRA[index] + 5
  };
});

/** A checksum of the bytes as they were, which the format ends with so that they can be checked once restored */
const adler32 = (bytes: Uint8Array): number => {
  let low = 1;
  let high = 0;

  for (let start = 0; start < bytes.length; start += 5552) {
    const end = Math.min(bytes.length, start + 5552);

    // The sums are only brought back into range every so often, which is as rarely as can be done without them overflowing
    for (let index = start; index < end; index++) {
      low += bytes[index];
      high += low;
    }

    low %= 65521;
    high %= 65521;
  }

  return ((high << 16) | low) >>> 0;
};

/** Compresses bytes, by their runs alone */
export const deflate = (bytes: Uint8Array): Uint8Array => {
  // No byte takes more than nine bits, so this is more than the most that could be written
  const out = new Uint8Array(Math.ceil((bytes.length * 9) / 8) + 16);
  let offset = 2;
  let buffer = 0;
  let filled = 0;

  const write = (bits: number, size: number): void => {
    buffer |= bits << filled;
    filled += size;

    while (filled >= 8) {
      out[offset++] = buffer & 0xff;
      buffer >>>= 8;
      filled -= 8;
    }
  };

  // The format's own two bytes, which say how the rest is compressed
  out[0] = 0x78;
  out[1] = 0x01;
  // All of it is one block, the last, which uses the table of codes that is built in
  write(0b011, 3);

  let index = 0;

  while (index < bytes.length) {
    const byte = bytes[index++];
    let run = 0;

    write(LITERAL_CODES[byte], byte < 144 ? 8 : 9);

    while (index + run < bytes.length && bytes[index + run] === byte) run++;

    while (run >= MIN_RUN) {
      const length = Math.min(run, MAX_RUN);

      write(RUNS[length].bits, RUNS[length].size);
      run -= length;
      index += length;
    }
  }

  // The seven empty bits that end the block, and then whatever it takes to end on a whole byte
  write(0, 7);
  if (filled) write(0, 8 - filled);

  new DataView(out.buffer).setUint32(offset, adler32(bytes));

  return out.subarray(0, offset + 4);
};

/* eslint-enable no-bitwise */
