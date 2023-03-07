import React, { memo } from "react";
import { DialogDismiss, DialogHeading } from "ariakit";
import { MdOutlineSettings } from "react-icons/md";
import { Modal, ModalHeader } from "../../../components/Modal";
import { sizes } from "../../../utils";
import { Frame, SizeButton } from "./elements";

const SizeButtons: React.FC = memo(() => (
  <>
    {sizes.map(([width, height]) => {
      const size = `${width}×${height}`;
      return (
        <SizeButton key={size} href={`${width}x${height}`}>
          {size}
        </SizeButton>
      );
    })}
  </>
));

SizeButtons.displayName = `SizeButtons`;

export const Config: React.FC = memo(() => (
  <Modal label={<MdOutlineSettings />} aria-label={`Config`}>
    <ModalHeader>
      <DialogHeading>Game Settings:</DialogHeading>
      <DialogDismiss />
    </ModalHeader>
    <Frame>
      <SizeButtons />
    </Frame>
  </Modal>
));

Config.displayName = `Config`;
