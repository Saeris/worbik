import { Tile } from "#components/Tile";
import { deficiencies } from "#theme/vision";
import styles from "./palette.module.css";

/**
 * A development-only page for reviewing the palette by eye: a game in
 * progress with a tile in every state, in both color schemes, as it appears
 * with typical vision, with each color vision deficiency, and in grayscale.
 */

const schemes = [`light`, `dark`] as const;

const views = [`typical`, ...Object.keys(deficiencies), `grayscale`];

/** Styles which run an element through the SVG filter that simulates each view */
const filters: Record<string, React.CSSProperties> = Object.fromEntries(
  views.slice(1).map((view) => [view, { filter: `url(#${view})` }])
);

const board = [
  { letters: `BROOM`, hints: `BROOM`, solved: true },
  { letters: `CEKCN`, hints: `CH  N` },
  { letters: `HARDL`, hints: `DE A ` },
  { letters: `ERCUY`, hints: `     ` }
];

const Board: React.FC = () => (
  <div className={styles.board}>
    {board.map(({ letters, hints, solved }, x) => (
      <div key={letters} className={styles.row}>
        {letters.split(``).map((letter, y) => (
          <Tile
            // oxlint-disable-next-line react/no-array-index-key -- the board is static
            key={y}
            x={x}
            y={y}
            char={letter}
            hint={hints.charAt(y)}
            solved={solved}
            disabled
          />
        ))}
      </div>
    ))}
  </div>
);

/** The widths of tile to review, from the smallest that a tile can be to the largest */
const sizes = [32, 36, 40, 48, 56, 64, 80];

/** A tile in each state, using the letters that come closest to touching one another */
const samples = [
  { letter: `Q`, hint: `W` },
  { letter: `L`, hint: `M` },
  { letter: `Z`, hint: `Q` },
  { letter: `W`, hint: `W` },
  { letter: `M`, hint: `M`, solved: true }
];

/** Styles which give a row of samples just enough room for tiles of each size */
const widths: Record<number, React.CSSProperties> = Object.fromEntries(
  sizes.map((size) => [
    size,
    { inlineSize: samples.length * size + (samples.length - 1) * 4 }
  ])
);

const Scale: React.FC = () => (
  <div className={styles.scale}>
    {sizes.map((size) => (
      <figure key={size} className={styles.size}>
        <figcaption>{size}px</figcaption>
        <div className={styles.row} style={widths[size]}>
          {samples.map(({ letter, hint, solved }, y) => (
            <Tile
              key={letter}
              x={0}
              y={y}
              char={letter}
              hint={hint}
              solved={solved}
              disabled
            />
          ))}
        </div>
      </figure>
    ))}
  </div>
);

const Palette: React.FC = () => (
  <main className={styles.page}>
    <header>
      <h1>Palette Review</h1>
      <p>
        Each simulation shows the worst case of a color vision deficiency, where
        one type of cone cell is missing entirely. Most people with a deficiency
        can tell apart more than is shown here.
      </p>
    </header>
    <svg className={styles.filters} aria-hidden>
      {Object.entries(deficiencies).map(([name, matrix]) => (
        <filter key={name} id={name} colorInterpolationFilters="linearRGB">
          <feColorMatrix
            type="matrix"
            values={[...matrix.map((row) => [...row, 0, 0]), [0, 0, 0, 1, 0]]
              .flat()
              .join(` `)}
          />
        </filter>
      ))}
      <filter id="grayscale" colorInterpolationFilters="linearRGB">
        <feColorMatrix type="saturate" values="0" />
      </filter>
    </svg>
    <div className={styles.schemes}>
      {schemes.map((scheme) => (
        <section key={scheme} className={styles.scheme} data-scheme={scheme}>
          <Scale />
          {views.map((view) => (
            <figure key={view} className={styles.view} style={filters[view]}>
              <figcaption>{view}</figcaption>
              <Board />
            </figure>
          ))}
        </section>
      ))}
    </div>
  </main>
);

export default Palette;
