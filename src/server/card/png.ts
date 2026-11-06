import type { RGB } from "#utils/stamp";
import { deflate } from "./deflate";

/**
 * Writes pictures as PNG files, with nothing but what a Worker already has.
 *
 * A Worker on the free plan gets ten milliseconds of processor time for a
 * request, which rules out the usual ways of making a picture. This does as
 * little as it can: a picture is limited to sixteen colors, so that each
 * pixel takes half a byte, and it's compressed by its runs of the same byte
 * alone.
 */

/** The most colors that a picture can use */
export const MAX_COLORS = 16;

/* eslint-disable no-bitwise */

/** The checksums of every possible byte, from which the checksum of any run of bytes is worked out */
const CRC_TABLE = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;

  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }

  return value >>> 0;
});

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;

  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }

  return (crc ^ 0xffffffff) >>> 0;
};

/**
 * Lays rows of pixels out the way that a PNG stores them: each led by a byte
 * that says how it's stored, which here is as its difference from the row
 * above it.
 *
 * Most rows of a picture made of flat shapes are the same as the one above,
 * and so come out as nothing but zeroes, which is the one kind of
 * repetition that the picture is then compressed by.
 */
const toScanlines = (
  stride: number,
  height: number,
  rows: Uint8Array
): Uint8Array<ArrayBuffer> => {
  const lines = new Uint8Array((stride + 1) * height);

  for (let y = 0; y < height; y++) {
    const line = y * (stride + 1);
    const row = y * stride;

    lines[line] = 2;

    for (let x = 0; x < stride; x++) {
      lines[line + 1 + x] = rows[row + x] - (y ? rows[row + x - stride] : 0);
    }
  }

  return lines;
};

/* eslint-enable no-bitwise */

/** A named section of a PNG file: its length, its name, its contents, and a checksum of the last two */
const chunk = (type: string, data: Uint8Array): Uint8Array => {
  const bytes = new Uint8Array(12 + data.length);
  const view = new DataView(bytes.buffer);

  view.setUint32(0, data.length);
  bytes.set(new TextEncoder().encode(type), 4);
  bytes.set(data, 8);
  view.setUint32(8 + data.length, crc32(bytes.subarray(4, 8 + data.length)));

  return bytes;
};

const SIGNATURE = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);

/**
 * Encodes a picture as a PNG file.
 *
 * The picture is given as rows of pixels, two to a byte, each of which is
 * the place in the palette of that pixel's color.
 */
export const encodePNG = (
  width: number,
  height: number,
  rows: Uint8Array,
  palette: readonly RGB[]
): Uint8Array<ArrayBuffer> => {
  if (palette.length > MAX_COLORS) {
    throw new Error(`A picture can use ${MAX_COLORS} colors at most`);
  }

  const header = new Uint8Array(13);
  const view = new DataView(header.buffer);

  view.setUint32(0, width);
  view.setUint32(4, height);
  // Four bits to a pixel, each of which is a place in the palette
  header[8] = 4;
  header[9] = 3;

  const chunks = [
    SIGNATURE,
    chunk(`IHDR`, header),
    chunk(`PLTE`, Uint8Array.from(palette.flat())),
    chunk(`IDAT`, deflate(toScanlines(Math.ceil(width / 2), height, rows))),
    chunk(`IEND`, new Uint8Array(0))
  ];
  const file = new Uint8Array(
    chunks.reduce((length, part) => length + part.length, 0)
  );
  let offset = 0;

  for (const part of chunks) {
    file.set(part, offset);
    offset += part.length;
  }

  return file;
};
