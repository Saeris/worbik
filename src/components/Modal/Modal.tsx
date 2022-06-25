import type { DialogState } from "ariakit/dialog/dialog-state";
import { useDialogState } from "ariakit/dialog/dialog-state";
import React from "react";
import { Open, Container } from "./elements";

export interface ModalProps extends Partial<DialogState> {
  label?: React.ReactNode;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  label = ``,
  children,
  ...props
}) => {
  const dialog = useDialogState(props);
  return (
    <>
      <Open onClick={dialog.toggle} aria-label={props[`aria-label`]}>
        {label}
      </Open>
      <Container state={dialog}>{children}</Container>
    </>
  );
};
