import React, { useCallback, useRef } from "react";
import {
  type SliderBaseStateProps,
  type SliderThumbStateProps,
  useSliderBaseState,
  useSliderState,
  useSliderThumbState
} from "./temp";
import type { FormState } from "ariakit";
import { Container, Handle, Track, Value } from "./elements";

const Thumb: React.FC<SliderThumbStateProps> = ({ index, state, ...props }) => {
  const sliderThumb = useSliderThumbState({
    index,
    state,
    ...props
  });

  return (
    <>
      <Handle
        state={sliderThumb}
        style={{
          left: `calc(${state.getThumbPercent(index) * 100}%)`
        }}
      />
      <Value
        style={{
          left: `calc(${state.getThumbPercent(index) * 100}%)`
        }}
      >
        {state.getThumbValueLabel(index)}
      </Value>
    </>
  );
};

export const Slider: React.FC<
  { name: string; state: FormState } & Omit<
    SliderBaseStateProps,
    "value" | "onChange"
  >
> = ({ name, state, ...props }) => {
  const track = useRef<HTMLDivElement>(null);
  const base = useSliderBaseState({
    onChange: useCallback(
      (value: number | number[]) => {
        state.setValue(name, value);
      },
      [state.setValue, name]
    ),
    value: state.values[name],
    ...props
  });
  const slider = useSliderState({
    ...props,
    state: base
  });

  return (
    <Container state={slider}>
      <Track
        state={slider}
        ref={track}
        $fill={`${base.getValuePercent(base.values[0]) * 100}%`}
      />
      <Thumb
        index={0}
        state={base}
        orientation={props.orientation}
        isDisabled={props.isDisabled}
        trackRef={slider.trackRef}
        aria-label="Thumb"
      />
    </Container>
  );
};
