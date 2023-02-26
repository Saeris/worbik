import * as React from "react";
import { useSlider } from "@react-aria/slider";
import { AriaSliderProps } from "@react-types/slider";
import { SliderBaseState } from "./useSliderBaseState";

export type SliderState = {
  /**
   * Ref for the "track" element.  The width of this element provides the "length"
   * of the track -- the span of one dimensional space that the slider thumb can be.  It also
   * accepts click and drag motions, so that the closest thumb will follow clicks and drags on
   * the track..
   */
  trackRef: React.RefObject<HTMLElement>;

  /** Props for the label element. */
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;

  /** Props for the root element of the slider component; groups slider inputs. */
  groupProps: React.HTMLAttributes<HTMLElement>;

  /** Props for the track element. */
  trackProps: React.HTMLAttributes<HTMLElement>;

  /** Props for the output element, displaying the value of the slider thumbs. */
  outputProps: React.OutputHTMLAttributes<HTMLOutputElement>;

  /**
   * Object returned by the `useSliderBaseState` hook.
   */
  baseState: SliderBaseState;
};

export type SliderStateProps = AriaSliderProps & {
  /**
   * Object returned by the `useSliderBaseState` hook.
   */
  state: SliderBaseState;
};

export function useSliderState({
  state,
  ...rest
}: SliderStateProps): SliderState {
  const trackRef = React.useRef<HTMLElement>(null);

  return { ...useSlider(rest, state, trackRef), trackRef, baseState: state };
}
