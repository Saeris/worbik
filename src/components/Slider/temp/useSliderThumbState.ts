import * as React from "react";
import { SliderThumbAria, useSliderThumb } from "@react-aria/slider";
import { AriaSliderThumbProps } from "@react-types/slider";

import { SliderBaseState } from "./useSliderBaseState";

export type SliderThumbState = SliderThumbAria & {
  /** A ref to the thumb input element. */
  inputRef: React.RefObject<HTMLInputElement>;
  /**
   * Object returned by the `useSliderBaseState` hook.
   */
  baseState: SliderBaseState;
};

export type SliderThumbStateProps = AriaSliderThumbProps & {
  /** A ref to the track element. */
  trackRef: React.RefObject<HTMLElement>;
  /**
   * Object returned by the `useSliderBaseState` hook.
   */
  state: SliderBaseState;
};

export function useSliderThumbState({
  state,
  trackRef,
  ...thumbProps
}: SliderThumbStateProps): SliderThumbState {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const sliderThumbProps = useSliderThumb(
    {
      inputRef,
      trackRef,
      ...thumbProps
    },
    state
  );

  return { ...sliderThumbProps, inputRef, baseState: state };
}
