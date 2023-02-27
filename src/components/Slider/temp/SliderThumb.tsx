import * as React from "react";
import {
  createComponent,
  createElement,
  createHook
} from "ariakit-utils/system";
import { VisuallyHidden } from "ariakit";
import type { As, Options, Props, HTMLProps } from "ariakit-utils/types";
import { mergeProps } from "@react-aria/utils";
import { SliderInput } from "./SliderInput";
import type { SliderThumbState } from "./useSliderThumbState";

export type SliderThumbOptions<T extends As = "div"> = Options<T> & {
  /**
   * Object returned by the `useSliderThumbState` hook.
   */
  state: SliderThumbState;
};

export type SliderThumbProps<T extends As = "div"> = Props<
  SliderThumbOptions<T>
>;

export const useSliderThumb = createHook<SliderThumbOptions>(
  ({ state, ...props }) =>
    mergeProps(state.thumbProps, {
      children: (
        <VisuallyHidden>
          <SliderInput state={state} />
        </VisuallyHidden>
      ),
      ...props
    }) as HTMLProps<SliderThumbOptions>
);

export const SliderThumb = createComponent<SliderThumbOptions>((props) =>
  createElement(`div`, useSliderThumb(props))
);
