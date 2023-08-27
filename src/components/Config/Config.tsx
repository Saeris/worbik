"use client";
import React, { memo } from "react";
import Link from "next/link";
import {
  DialogDismiss,
  DialogHeading,
  useRadioStore,
  RadioGroup,
  Radio
} from "@ariakit/react";
import { PiGearThin, PiXThin } from "react-icons/pi";
import { sizes } from "#utils";
import { useThemeMode } from "#hooks";
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

export const Config: React.FC = memo(() => {
  const { modes, themeMode, setThemeMode } = useThemeMode();
  const radio = useRadioStore({
    defaultValue: themeMode,
    setValue: (val) => setThemeMode(val as (typeof modes)[number])
  });

  return (
    <Modal label={<PiGearThin />} aria-label={`Config`}>
      <ModalHeader>
        <DialogHeading>Settings:</DialogHeading>
        <DialogDismiss>
          <PiXThin />
        </DialogDismiss>
      </ModalHeader>
      <h1 className={styles.header}>Theme Mode</h1>
      <RadioGroup store={radio} className={styles.group}>
        {modes.map((option) => (
          <label key={option} className={styles.radio}>
            <Radio value={option} />
            {option}
          </label>
        ))}
      </RadioGroup>
      <h1 className={styles.header}>Board Size</h1>
      <article className={styles.frame}>
        <SizeButtons />
      </article>
    </Modal>
  );
});

Config.displayName = `Config`;
