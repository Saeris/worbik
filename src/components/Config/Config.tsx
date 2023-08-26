"use client";
import React, { memo } from "react";
import Link from "next/link";
import { DialogDismiss, DialogHeading } from "@ariakit/react";
import { PiGearThin, PiXThin } from "react-icons/pi";
import { sizes } from "#utils";
import { Modal, ModalHeader } from "../Modal";
import styles from "./Config.module.css";

const SizeButtons: React.FC = memo(() => (
  <>
    {sizes.map(([width, height]) => {
      const size = `${width}×${height}`;
      return (
        <Link key={size} className={styles.size} href={`${width}x${height}`}>
          {size}
        </Link>
      );
    })}
  </>
));

SizeButtons.displayName = `SizeButtons`;

export const Config: React.FC = memo(() => (
  <Modal label={<PiGearThin />} aria-label={`Config`}>
    <ModalHeader>
      <DialogHeading>Game Settings:</DialogHeading>
      <DialogDismiss>
        <PiXThin />
      </DialogDismiss>
    </ModalHeader>
    <article className={styles.frame}>
      <SizeButtons />
    </article>
  </Modal>
));

Config.displayName = `Config`;
