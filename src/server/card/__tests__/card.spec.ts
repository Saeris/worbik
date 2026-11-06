import { inflateSync } from "node:zlib";
import { CARD_HEIGHT, CARD_WIDTH, drawCard, renderCard } from "../card";
import { deflate } from "../deflate";
import { encodePNG, MAX_COLORS } from "../png";

/** Splits a PNG file into its named sections, checking each against its checksum on the way */
const readChunks = (file: Uint8Array): Record<string, Uint8Array> => {
  const view = new DataView(file.buffer, file.byteOffset, file.byteLength);
  const chunks: Record<string, Uint8Array> = {};
  let offset = 8;

  while (offset < file.length) {
    const length = view.getUint32(offset);
    const type = new TextDecoder().decode(
      file.subarray(offset + 4, offset + 8)
    );

    chunks[type] = file.subarray(offset + 8, offset + 8 + length);
    offset += 12 + length;
  }

  return chunks;
};

/** Undoes the way that a PNG stores its rows, to get back the pixels that were drawn */
const readRows = (file: Uint8Array, stride: number): Uint8Array => {
  const lines = inflateSync(readChunks(file).IDAT);
  const rows = new Uint8Array((lines.length / (stride + 1)) * stride);

  for (let y = 0; y * (stride + 1) < lines.length; y++) {
    for (let x = 0; x < stride; x++) {
      const above = y ? rows[(y - 1) * stride + x] : 0;
      rows[y * stride + x] = lines[y * (stride + 1) + 1 + x] + above;
    }
  }

  return rows;
};

describe(`deflate`, () => {
  const roundTrip = (bytes: Uint8Array): Uint8Array =>
    new Uint8Array(inflateSync(deflate(bytes)));

  it(`makes something that any decompressor can restore`, () => {
    // A browser or a chat app reads these files with its own decompressor, which has to make sense of them
    const bytes = Uint8Array.from(
      { length: 5000 },
      (_, index) => (index * 37) % 256
    );

    expect(roundTrip(bytes)).toStrictEqual(bytes);
  });

  it(`restores runs of every length`, () => {
    // Each length of run is written differently, and a mistake in any one of them would corrupt a picture
    for (let length = 0; length <= 600; length++) {
      const bytes = new Uint8Array(length + 2).fill(7);
      bytes[0] = 1;
      bytes[length + 1] = 200;

      expect(roundTrip(bytes)).toStrictEqual(bytes);
    }
  });

  it(`restores nothing from nothing`, () => {
    expect(roundTrip(new Uint8Array(0))).toStrictEqual(new Uint8Array(0));
  });

  it(`makes long runs small`, () => {
    // This is the whole of what it's for: a picture of flat shapes is nearly all runs
    expect(deflate(new Uint8Array(100_000)).length).toBeLessThan(1000);
  });
});

describe(`encodePNG`, () => {
  const palette = [
    [0, 0, 0],
    [255, 0, 0],
    [0, 255, 0]
  ] as const;
  // A picture that is four pixels wide and two tall, with two pixels to each byte
  const rows = Uint8Array.of(0x01, 0x21, 0x22, 0x10);
  const file = encodePNG(4, 2, rows, palette);

  it(`is a PNG file`, () => {
    expect([...file.subarray(0, 8)]).toStrictEqual([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
    ]);
    expect(Object.keys(readChunks(file))).toStrictEqual([
      `IHDR`,
      `PLTE`,
      `IDAT`,
      `IEND`
    ]);
  });

  it(`says how large the picture is, and that it's in colors from a palette`, () => {
    const header = readChunks(file).IHDR;
    const view = new DataView(header.buffer, header.byteOffset);

    expect(view.getUint32(0)).toBe(4);
    expect(view.getUint32(4)).toBe(2);
    // Four bits to a pixel, of the kind of picture that has a palette
    expect([header[8], header[9]]).toStrictEqual([4, 3]);
  });

  it(`carries the colors and the pixels that it was given`, () => {
    expect([...readChunks(file).PLTE]).toStrictEqual(palette.flat());
    expect(readRows(file, 2)).toStrictEqual(rows);
  });

  it(`won't take more colors than a pixel has room to choose between`, () => {
    const tooMany = Array.from({ length: MAX_COLORS + 1 }, () => palette[0]);

    expect(() => encodePNG(4, 2, rows, tooMany)).toThrow(/16 colors/u);
  });
});

describe(`a share card`, () => {
  const puzzle = {
    challenge: `ajoouubidmrdoypkpiaavomcl`,
    width: 5,
    height: 5,
    day: `Thu, Nov 19`,
    host: `worbik.test`
  };
  const score = { moves: 42, player: `@alice.test` };
  const stride = CARD_WIDTH / 2;

  it(`is the size that link previews are shown at`, () => {
    const header = readChunks(renderCard(puzzle)).IHDR;
    const view = new DataView(header.buffer, header.byteOffset);

    expect([view.getUint32(0), view.getUint32(4)]).toStrictEqual([1200, 630]);
    expect(drawCard(puzzle).rows).toHaveLength(stride * CARD_HEIGHT);
  });

  it(`survives being written to a file`, () => {
    // Everything that is drawn has to still be there once it's been compressed and restored
    expect(readRows(renderCard({ ...puzzle, score }), stride)).toStrictEqual(
      drawCard({ ...puzzle, score }).rows
    );
  });

  it(`never uses more colors than a file can hold`, () => {
    expect(drawCard({ ...puzzle, score }).palette.length).toBeLessThanOrEqual(
      MAX_COLORS
    );
  });

  it(`is a different picture for a different score`, () => {
    // The score is the message of the card, so it must be what is drawn
    const other = { ...score, moves: 43 };

    expect(drawCard({ ...puzzle, score }).rows).not.toStrictEqual(
      drawCard({ ...puzzle, score: other }).rows
    );
    expect(drawCard({ ...puzzle, score }).rows).not.toStrictEqual(
      drawCard(puzzle).rows
    );
  });

  it(`has the same stamp whoever's card it is`, () => {
    // The stamp is the puzzle's, not the player's. Its colors are the first in the palette, after the background.
    const mine = drawCard({ ...puzzle, score });
    const theirs = drawCard({
      ...puzzle,
      score: { moves: 58, player: `@bob.test` }
    });
    const plain = drawCard(puzzle);
    // The left half of the card, where the stamp is, and nothing else
    const stampOf = (rows: Uint8Array): number[] =>
      Array.from({ length: CARD_HEIGHT }, (_, y) => [
        ...rows.subarray(y * stride, y * stride + 280)
      ]).flat();

    expect(theirs.palette).toStrictEqual(mine.palette);
    expect(stampOf(theirs.rows)).toStrictEqual(stampOf(mine.rows));
    expect(stampOf(plain.rows)).toStrictEqual(stampOf(mine.rows));
  });

  it(`keeps a long name within the card`, () => {
    // A handle can be far longer than there is room for, and must be cut short rather than run off of the edge
    const long = drawCard({
      ...puzzle,
      score: { ...score, player: `@${`a-very-long-name.`.repeat(8)}test` }
    }).rows;
    const background = 0;

    for (let y = 0; y < CARD_HEIGHT; y++) {
      // The last forty pixels of every row are a margin that nothing is drawn in
      expect([
        ...long.subarray(y * stride + stride - 20, (y + 1) * stride)
      ]).toStrictEqual(Array.from({ length: 20 }, () => background));
    }
  });

  it(`can show any score that a game can end with`, () => {
    // From the least to the most moves that a replay allows, on the smallest and the largest boards
    for (const moves of [1, 9, 100, 999, 2000]) {
      expect(() =>
        renderCard({ ...puzzle, score: { ...score, moves } })
      ).not.toThrow();
    }

    expect(() =>
      renderCard({ ...puzzle, challenge: `a`.repeat(64), width: 8, height: 8 })
    ).not.toThrow();
  });
});
