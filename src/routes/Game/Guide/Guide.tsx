import React, { memo } from "react";
import { DialogDismiss, DialogHeading } from "@ariakit/react";
import { PiInfoThin, PiXThin } from "react-icons/pi";
import { Modal, ModalHeader } from "../../../components/Modal";
import { Tile } from "../../../components/Tile";
import styles from "./Guide.module.css";

const numbers = {
  5: `five`,
  6: `six`,
  7: `seven`,
  8: `eight`
} as const;

export interface GuideProps {
  width: number;
  height: number;
}

export const Guide: React.FC<GuideProps> = memo(({ width, height }) => (
  <Modal label={<PiInfoThin />} aria-label={`How to Play`}>
    <ModalHeader>
      <DialogHeading>How To Play:</DialogHeading>
      <DialogDismiss>
        <PiXThin />
      </DialogDismiss>
    </ModalHeader>
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
      <Tile x={0} y={0} char="W" hint="W" correct disabled />
      <Tile x={0} y={0} char="O" hint="O" correct disabled />
      <Tile x={0} y={0} char="R" hint="R" correct disabled />
      <Tile x={0} y={0} char="B" hint="B" correct disabled />
      <Tile x={0} y={0} char="I" hint="I" correct disabled />
      <Tile x={0} y={0} char="K" hint="K" correct disabled />
    </div>
    <p>{`When you complete a row, all of the tiles will turn green. Get all of the letters in the correct position to win!`}</p>
  </Modal>
));

Guide.displayName = `Guide`;
