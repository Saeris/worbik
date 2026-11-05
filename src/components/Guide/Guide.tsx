import { memo } from "react";
import type { Size } from "#utils";
import { PiInfoThin } from "react-icons/pi";
import { Modal } from "../Modal";
import { Tile } from "../Tile";
import styles from "./Guide.module.css";

const numbers = {
  5: `five`,
  6: `six`,
  7: `seven`,
  8: `eight`
} as const;

export interface GuideProps {
  width: Size;
  height: Size;
}

export const Guide: React.FC<GuideProps> = memo(({ width, height }) => (
  <Modal label={<PiInfoThin />} aria-label="How to Play" title="How To Play:">
    <p>
      {`Hidden in this puzzle are `}
      <strong>{`${String(numbers[height])} words`}</strong>
      {` that are each `}
      <strong>{`${String(numbers[width])} letters`}</strong>
      {` long.`}
    </p>
    <p>{`There is one word per row.`}</p>
    <p>
      {`Use the buttons around the edges to
        rotate the columns and rows in order to find the correct position of
        each letter and decode all ${String(numbers[height])} words.`}
    </p>
    <div className={styles.row}>
      <Tile x={0} y={0} char="W" hint="W" disabled />
    </div>
    <p>{`As you play, letters in the correct position will turn their tile yellow and will permanently display a reminder in the bottom right corner.`}</p>
    <div className={styles.row}>
      <Tile x={0} y={0} char="W" hint="W" solved disabled />
      <Tile x={0} y={0} char="O" hint="O" solved disabled />
      <Tile x={0} y={0} char="R" hint="R" solved disabled />
      <Tile x={0} y={0} char="B" hint="B" solved disabled />
      <Tile x={0} y={0} char="I" hint="I" solved disabled />
      <Tile x={0} y={0} char="K" hint="K" solved disabled />
    </div>
    <p>{`When you complete a row, all of the tiles will turn green. Get all of the letters in the correct position to win!`}</p>
  </Modal>
));

Guide.displayName = `Guide`;
