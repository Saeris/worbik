import { useNumberFormatter } from "@react-aria/i18n";
import { SliderState, useSliderState } from "@react-stately/slider";
import { SliderProps as SliderStateProps } from "@react-types/slider";

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
