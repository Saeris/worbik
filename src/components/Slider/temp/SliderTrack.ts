import {
  createComponent,
  createElement,
  createHook
} from "ariakit-utils/system";
import { useForkRef, type HTMLProps } from "ariakit-utils";
import type { As, Options, Props } from "ariakit-utils/types";
import { mergeProps } from "@react-aria/utils";
import type { SliderState } from "./useSliderState";

export type SliderTrackOptions<T extends As = "div"> = Options<T> & {
  /**
   * Object returned by the `useSliderState` hook.
   */
  state: SliderState;
};

export type SliderTrackProps<T extends As = "div"> = Props<
  SliderTrackOptions<T>
>;

export const useSliderTrack = createHook<SliderTrackOptions>(
  ({ state, ...props }) =>
    mergeProps(state.trackProps, {
      ...props,
      ref: useForkRef(state.trackRef, props.ref)
    }) as HTMLProps<SliderTrackOptions>
);

export const SliderTrack = createComponent<SliderTrackOptions>((props) =>
  createElement(`div`, useSliderTrack(props))
);
