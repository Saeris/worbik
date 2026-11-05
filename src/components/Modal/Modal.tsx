import { useId } from "react";
import { PiXThin } from "react-icons/pi";
import styles from "./Modal.module.css";

// The dialog is opened and closed declaratively using Invoker Commands,
// which are polyfilled only for the browsers that don't yet support them
if (
  typeof HTMLButtonElement !== `undefined` &&
  !(`commandForElement` in HTMLButtonElement.prototype)
) {
  void import(`invokers-polyfill`);
}

/**
 * Closes the dialog when its backdrop is clicked, for the browsers
 * that don't yet support doing so declaratively with `closedby="any"`
 */
const lightDismiss: React.MouseEventHandler<HTMLDialogElement> = ({
  target,
  currentTarget,
  clientX,
  clientY
}) => {
  // Clicks on the backdrop are dispatched to the dialog element itself
  if (`closedBy` in HTMLDialogElement.prototype || target !== currentTarget)
    return;

  const { top, bottom, left, right } = currentTarget.getBoundingClientRect();

  if (clientY < top || clientY > bottom || clientX < left || clientX > right) {
    currentTarget.close();
  }
};

export interface ModalProps {
  /** The contents of the button which opens the dialog */
  readonly label: React.ReactNode;
  /** An accessible name for the button which opens the dialog */
  readonly "aria-label": string;
  /** The heading displayed at the top of the dialog */
  readonly title: string;
  readonly children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  label,
  title,
  children,
  ...props
}) => {
  const id = useId();
  const titleId = `${id}-title`;

  return (
    <>
      <button
        type="button"
        className={styles.open}
        command="show-modal"
        commandfor={id}
        aria-label={props[`aria-label`]}
      >
        {label}
      </button>
      {/* oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events -- keyboard users dismiss the dialog with the Escape key */}
      <dialog
        id={id}
        className={styles.container}
        closedby="any"
        aria-labelledby={titleId}
        onClick={lightDismiss}
      >
        <header className={styles.header}>
          <h1 id={titleId}>{title}</h1>
          <button
            type="button"
            command="close"
            commandfor={id}
            aria-label="Close"
          >
            <PiXThin />
          </button>
        </header>
        {children}
      </dialog>
    </>
  );
};
