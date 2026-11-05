import { readFileSync } from "node:fs";
import Color from "colorjs.io";
import { deficiencies, type ColorMatrix } from "../vision";

const schemes = [`light`, `dark`] as const;

type Scheme = (typeof schemes)[number];

/**
 * Every color in the theme that is declared as `light-dark(<light>, <dark>)`,
 * read straight from the stylesheet so that what's tested is what ships
 */
const css = readFileSync(new URL(`../theme.css`, import.meta.url), `utf8`);

const tokens = new Map(
  Array.from(
    css.matchAll(
      /--(?<name>[\w-]+):\s*light-dark\(\s*(?<light>oklch\([^)]*\))\s*,\s*(?<dark>oklch\([^)]*\))\s*\)/g
    ),
    ({ groups }) => [
      groups!.name,
      { light: new Color(groups!.light), dark: new Color(groups!.dark) }
    ]
  )
);

/** The name of the color that one of the non-color tokens, like the focus ring's, is drawn in */
const colorOf = (name: string): string => {
  const [, color] =
    new RegExp(`--${name}:[^;]*var\\(--(?<color>[\\w-]+)\\)\\s*;`).exec(css) ??
    [];
  if (!color) throw new Error(`The theme's --${name} doesn't use a color`);
  return color;
};

const token = (name: string, scheme: Scheme): Color => {
  const value = tokens.get(name);
  if (!value) throw new Error(`The theme doesn't define a --${name} color`);
  return value[scheme];
};

const simulate = (color: Color, matrix: ColorMatrix): Color => {
  const [r, g, b] = color.to(`srgb-linear`).coords.map((value) => value ?? 0);
  return new Color(
    `srgb-linear`,
    matrix.map(([x, y, z]) => x * r + y * g + z * b) as [number, number, number]
  );
};

/** How each kind of vision sees a color, including seeing no color at all */
const views: Record<string, (color: Color) => Color> = {
  "typical vision": (color) => color,
  ...Object.fromEntries(
    Object.entries(deficiencies).map(([name, matrix]) => [
      name,
      (color: Color): Color => simulate(color, matrix)
    ])
  )
};

const lightness = (color: Color): number => color.to(`lab-d65`).coords[0] ?? 0;

const states = [`neutral`, `correct`, `solved`] as const;

const pairs = states.flatMap((a, i) =>
  states.slice(i + 1).map((b) => [a, b] as const)
);

describe.each(schemes)(`tile states in the %s color scheme`, (scheme) => {
  /*
   * A perceptual difference (CIEDE2000) of 20 is the floor that published
   * accessible palettes hold a handful of categorical colors to. The original
   * palette managed only 4 between a correct and a solved tile under
   * protanopia, because its yellow and green shared the same lightness.
   */
  it.each(Object.keys(views))(
    `can each be told apart from the others with %s`,
    (view) => {
      for (const [a, b] of pairs) {
        const difference = views[view](token(`${a}-bg`, scheme)).deltaE(
          views[view](token(`${b}-bg`, scheme)),
          `2000`
        );

        expect(
          difference,
          `${a} and ${b} tiles are too alike`
        ).toBeGreaterThanOrEqual(20);
      }
    }
  );

  it(`can each be told apart from the others by lightness alone`, () => {
    // Lightness survives every color vision deficiency, as well as grayscale displays and print
    for (const [a, b] of pairs) {
      const difference = Math.abs(
        lightness(token(`${a}-bg`, scheme)) -
          lightness(token(`${b}-bg`, scheme))
      );

      expect(
        difference,
        `${a} and ${b} tiles are too close in lightness`
      ).toBeGreaterThanOrEqual(10);
    }
  });

  it(`get further from the page the closer they are to being solved`, () => {
    // The order of the lightness rungs carries meaning of its own, so it has to read the same in both schemes
    const [neutral, correct, solved] = states.map((state) =>
      Math.abs(
        lightness(token(`${state}-bg`, scheme)) - lightness(token(`bg`, scheme))
      )
    );

    expect(correct).toBeGreaterThan(neutral);
    expect(solved).toBeGreaterThan(correct);
  });

  it.each(states)(`keeps the letter on a %s tile legible`, (state) => {
    // Letters are set large but in a very thin weight, which needs more contrast than body text does
    const contrast = Math.abs(
      token(`${state}-bg`, scheme).contrast(
        token(`${state}-fg`, scheme),
        `APCA`
      )
    );

    expect(contrast).toBeGreaterThanOrEqual(60);
  });
});

describe.each(schemes)(`the focus ring in the %s color scheme`, (scheme) => {
  // WCAG asks for a contrast of 3:1 between a focus indicator and the colors next to it
  const contrast = (a: Color, b: Color): number => a.contrast(b, `WCAG21`);
  const outline = token(colorOf(`focus-outline`), scheme);
  const gap = token(colorOf(`focus-gap`), scheme);

  it(`is made of two tones that stand apart from one another`, () => {
    expect(contrast(outline, gap)).toBeGreaterThanOrEqual(3);
  });

  it.each(states)(
    `stands out against a %s tile with at least one of its tones`,
    (state) => {
      // No single color contrasts with every tile, which is the whole reason for the ring having two
      const tile = token(`${state}-bg`, scheme);

      expect(
        Math.max(contrast(outline, tile), contrast(gap, tile))
      ).toBeGreaterThanOrEqual(3);
    }
  );

  it(`stands out against the page`, () => {
    expect(contrast(outline, token(`bg`, scheme))).toBeGreaterThanOrEqual(3);
  });
});
