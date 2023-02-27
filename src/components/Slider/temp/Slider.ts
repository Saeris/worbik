import {
  createComponent,
  createElement,
  createHook
} from "ariakit-utils/system";
import type { As, Options, Props } from "ariakit-utils/types";
import { mergeProps } from "@react-aria/utils";
import type { SliderState } from "./useSliderState";

export type SliderOptions<T extends As = "div"> = Options<T> & {
  /**
   * Object returned by the `useSliderState` hook.
   */
  state: SliderState;
};

export type SliderProps<T extends As = "div"> = Props<SliderOptions<T>>;

export const useSlider = createHook<SliderOptions>(({ state, ...props }) =>
  mergeProps(state.groupProps, props)
);

export const Slider = createComponent<SliderOptions>((props) =>
  createElement(`div`, useSlider(props))
);
