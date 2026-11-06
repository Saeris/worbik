import { getStamp, getStampColors, SHADES } from "../stamp";

const challenge = `ajoouubidmrdoypkpiaavomcl`;

describe(`getStamp`, () => {
  it(`is the same every time for the same puzzle`, () => {
    // Everyone who plays a puzzle has to be shown the same stamp for it, wherever it's drawn
    expect(getStamp(challenge, 5)).toStrictEqual(getStamp(challenge, 5));
  });

  it(`differs from one puzzle to the next`, () => {
    // Swapping two letters is the smallest difference that two puzzles can have
    const other = `jaoouubidmrdoypkpiaavomcl`;

    expect(getStamp(other, 5)).not.toStrictEqual(getStamp(challenge, 5));
  });

  it(`takes the shape of the puzzle's board`, () => {
    // So that a 7×6 can be told from a 5×5 at a glance
    const stamp = getStamp(`a`.repeat(42), 7);

    expect(stamp.tiles).toHaveLength(6);
    expect(stamp.tiles.every((row) => row.length === 7)).toBe(true);
  });

  it(`gives nothing away about which letters are already in place`, () => {
    // Those are given in uppercase, and are the one part of the solution that the scrambled letters carry
    expect(getStamp(`AjooUubidmrdoypkpiaavomcL`, 5)).toStrictEqual(
      getStamp(challenge, 5)
    );
  });

  it(`mirrors each row about its middle`, () => {
    for (const width of [5, 6, 7, 8]) {
      for (const row of getStamp(`a`.repeat(width * 5), width).tiles) {
        expect([...row].reverse()).toStrictEqual(row);
      }
    }
  });

  it(`only uses shades that there are colors for`, () => {
    const { hue, tiles } = getStamp(challenge, 5);

    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
    expect(tiles.flat().every((shade) => shade >= 0 && shade < SHADES)).toBe(
      true
    );
  });
});

describe(`getStampColors`, () => {
  it(`has a color for every shade, and one more for the edge of the darkest`, () => {
    expect(getStampColors(200)).toHaveLength(SHADES + 1);
  });

  it(`gets darker with every shade`, () => {
    // The pattern is carried by lightness, so that it survives being seen without its hue
    for (const hue of [0, 90, 180, 270]) {
      const luma = getStampColors(hue).map(
        ([red, green, blue]) => 0.2126 * red + 0.7152 * green + 0.0722 * blue
      );

      expect(luma).toStrictEqual([...luma].sort((a, b) => b - a));
      expect(new Set(luma).size).toBe(luma.length);
    }
  });

  it(`only makes colors that a screen can show`, () => {
    for (const hue of [0, 45, 135, 225, 315]) {
      for (const color of getStampColors(hue)) {
        expect(
          color.every(
            (value) => Number.isInteger(value) && value >= 0 && value <= 255
          )
        ).toBe(true);
      }
    }
  });

  it(`leans towards the hue that it's given`, () => {
    // The hues of sRGB's own red, green and blue, each of which should come out strongest in its own channel
    const strongest = (hue: number): number => {
      const color = getStampColors(hue)[2];
      return color.indexOf(Math.max(...color));
    };

    expect(strongest(29)).toBe(0);
    expect(strongest(142)).toBe(1);
    expect(strongest(264)).toBe(2);
  });
});
