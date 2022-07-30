import React from "react";
import { DialogDismiss, DialogHeading } from "ariakit/dialog";
import { MdOutlineInfo } from "react-icons/md";
import { Modal } from "../../../components/Modal";
import { Character, Hint, Row } from "../Puzzle/elements";
import { ModalHeader } from "./elements";

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

export const Guide: React.FC<GuideProps> = ({ width, height }) => (
  <Modal label={<MdOutlineInfo />} aria-label={`How to Play`}>
    <ModalHeader>
      <DialogHeading>How To Play:</DialogHeading>
      <DialogDismiss />
    </ModalHeader>
    <p>
      {`Hidden in this puzzle are ${numbers[height]} words that are each
        ${numbers[width]} letters long. Use the buttons around the edges to
        rotate the columns and rows in order to find the correct position of
        each letter.`}
    </p>
    <Row>
      <Character $hint disabled>
        {`W`}
        <Hint>{`W`}</Hint>
      </Character>
    </Row>
    <p>{`As you play, letters in the correct position will turn their tile yellow and will permanently display a reminder in the bottom right corner.`}</p>
    <Row>
      <Character $correct disabled>
        {`W`}
        <Hint>{`W`}</Hint>
      </Character>
      <Character $correct disabled>
        {`O`}
        <Hint>{`O`}</Hint>
      </Character>
      <Character $correct disabled>
        {`R`}
        <Hint>{`R`}</Hint>
      </Character>
      <Character $correct disabled>
        {`B`}
        <Hint>{`B`}</Hint>
      </Character>
      <Character $correct disabled>
        {`I`}
        <Hint>{`I`}</Hint>
      </Character>
      <Character $correct disabled>
        {`K`}
        <Hint>{`K`}</Hint>
      </Character>
    </Row>
    <p>{`When you complete a row, all of the tiles will turn green. Get all of the letters in the correct position to win!`}</p>
  </Modal>
);
