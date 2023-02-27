import { useNumberFormatter } from "@react-aria/i18n";
import type { SliderState } from "@react-stately/slider";
import { useSliderState } from "@react-stately/slider";
import type { SliderProps as SliderStateProps } from "@react-types/slider";

export type SliderBaseState = SliderState & {};

export type SliderBaseStateProps = SliderStateProps & {
  /**
   * The display format of the value label.
   */
  formatOptions?: Intl.NumberFormatOptions;
};

export const useSliderBaseState = (
  props: SliderBaseStateProps = {}
): SliderBaseState =>
  useSliderState({
    ...props,
    numberFormatter: useNumberFormatter(props.formatOptions)
  });
