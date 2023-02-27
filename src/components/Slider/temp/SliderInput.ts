import {
  createComponent,
  createElement,
  createHook
} from "ariakit-utils/system";
import { useForkRef, type HTMLProps } from "ariakit-utils";
import type { As, Options, Props } from "ariakit-utils/types";
import { mergeProps } from "@react-aria/utils";
import type { SliderThumbState } from "./useSliderThumbState";

export type SliderInputOptions<T extends As = "input"> = Options<T> & {
  /**
   * Object returned by the `useSliderState` hook.
   */
  state: SliderThumbState;
};

export type SliderInputProps<T extends As = "input"> = Props<
  SliderInputOptions<T>
>;

export const useSliderInput = createHook<SliderInputOptions>(
  ({ state, ...props }) =>
    mergeProps(state.inputProps, {
      ...props,
      ref: useForkRef(state.inputRef, props.ref)
    }) as HTMLProps<SliderInputOptions>
);

export const SliderInput = createComponent<SliderInputOptions>((props) =>
  createElement(`input`, useSliderInput(props))
);
