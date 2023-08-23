"use client";
import React from "react";
import {
  DialogDisclosure,
  Dialog,
  useDialogStore,
  type DialogStoreProps
} from "@ariakit/react";
import {
  createComponent,
  createElement
} from "@ariakit/react-core/utils/system";
import type { As, Options } from "@ariakit/react-core/utils/types";
import styles from "./Modal.module.css";

export interface ModalProps extends Partial<DialogStoreProps> {
  label?: React.ReactNode;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  label = ``,
  children = null,
  ...props
}) => {
  const dialog = useDialogStore(props);
  return (
    <>
      <DialogDisclosure
        className={styles.open}
        store={dialog}
        aria-label={props[`aria-label`]}
      >
        {label}
      </DialogDisclosure>
      <Dialog store={dialog} className={styles.container}>
        {children}
      </Dialog>
    </>
  );
};

export type ModalHeaderProps<T extends As = `header`> = Options<T>;

export const ModalHeader = createComponent<ModalHeaderProps>(
  ({ className, ...props }) =>
    createElement(`header`, {
      ...props,
      className: [styles.header, className].filter(Boolean).join(``)
    })
);
