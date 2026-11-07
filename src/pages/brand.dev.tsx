import styles from "./brand.module.css";

/**
 * Draws Worbik's icons and the card that its pages show when linked to, in
 * the game's own font and tile colors.
 *
 * Each picture is on the page at the exact size of the file that it's saved
 * as, under its file name in \`public/\`. So when the look of the game changes,
 * they can be saved again from here rather than being redrawn by hand. This
 * page only exists in development.
 */

interface IconProps {
  /** The name of the file that it's saved as, which is also how it's found on this page */
  file: string;
  /** How many pixels wide and tall it is */
  size: number;
  variant?: string;
}

/**
 * A "W" tile in its solved state, filling the icon. It runs right to the
 * edges, as phones cut their own shape out of an icon and would show
 * anything transparent as black.
 */
const Icon: React.FC<IconProps> = ({ file, size, variant }) => (
  <figure className={styles.art}>
    <div
      id={file}
      className={`${styles.icon} ${variant ?? ``}`}
      style={{ "--size": `${size}px` } as React.CSSProperties}
    >
      <b>W</b>
      <i aria-hidden>W</i>
    </div>
    <figcaption>{`${file} · ${size}×${size}`}</figcaption>
  </figure>
);

const LETTERS = `WORBIK`.split(``);

const Page: React.FC = () => (
  <main className={styles.page}>
    <h1>Brand art</h1>
    <p>
      Each picture is drawn at the size of its file in <code>public/</code>.
    </p>
    <div className={styles.row}>
      <Icon file="icon-512.png" size={512} />
      <Icon file="icon-maskable-512.png" size={512} variant={styles.maskable} />
      <Icon file="icon-192.png" size={192} />
      <Icon file="apple-touch-icon.png" size={180} />
      <Icon file="favicon-48.png" size={48} variant={styles.small} />
      <Icon file="favicon-32.png" size={32} variant={styles.small} />
      <Icon file="favicon-16.png" size={16} variant={styles.small} />
    </div>
    <figure className={styles.art}>
      <div id="share-card.png" className={styles.card}>
        <div className={styles.tiles}>
          {LETTERS.map((letter) => (
            <div key={letter} className={styles.tile}>
              <b>{letter}</b>
              <i aria-hidden>{letter}</i>
            </div>
          ))}
        </div>
        <div className={styles.words}>
          <h2>Worbik</h2>
          <p>Rotate the rows and columns until every row is a word.</p>
          <strong>Can you solve it?</strong>
          <span>worbik.com</span>
        </div>
      </div>
      <figcaption>share-card.png · 1200×630</figcaption>
    </figure>
  </main>
);

export default Page;
