import {
  createComponent,
  createElement,
  createHook
} from "ariakit-utils/system";
import { As, Options, Props } from "ariakit-utils/types";
import { mergeProps } from "@react-aria/utils";
import { SliderState } from "./useSliderState";

export type SliderOutputOptions<T extends As = "output"> = Options<T> & {
  /**
   * Object returned by the `useSliderState` hook.
   */
  state: SliderState;
};

export type SliderOutputProps<T extends As = "output"> = Props<
  SliderOutputOptions<T>
>;

export const useSliderOutput = createHook<SliderOutputOptions>(
  ({ state, ...props }) => mergeProps(state.outputProps, props)
);

export const SliderOutput = createComponent<SliderOutputOptions>((props) =>
  createElement("output", useSliderOutput(props))
);
