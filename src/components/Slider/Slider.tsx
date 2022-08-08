import React, { useCallback, useRef } from "react";
import type {
  SliderBaseStateProps,
  SliderThumbStateProps
} from "@adaptui/react";
import {
  useSliderBaseState,
  useSliderState,
  useSliderThumbState
} from "@adaptui/react";
import type { FormState } from "ariakit";
import { Container, Fill, Handle, HandleGroup, Track, Value } from "./elements";

const Thumb: React.FC<SliderThumbStateProps> = ({ index, state, ...props }) => {
  const sliderThumb = useSliderThumbState({ index, state, ...props });

  return (
    <HandleGroup
      style={{
        left: `calc(${state.getThumbPercent(index) * 100}% - 7px)`
      }}
    >
      <Handle state={sliderThumb} />
      <Value>{state.getThumbValueLabel(index)}</Value>
    </HandleGroup>
  );
};

export const Slider: React.FC<
  { name: string; state: FormState } & Omit<
    SliderBaseStateProps,
    "value" | "onChange"
  >
> = ({ name, state, ...props }) => {
  const track = useRef<HTMLDivElement>(null);
  const handleChange = useCallback(
    (value) => {
      state.setValue(name, value);
    },
    [state.setValue, name]
  );

  const base = useSliderBaseState({
    onChange: handleChange,
    value: state.values[name],
    ...props
  });
  const slider = useSliderState({
    ...props,
    state: base
  });

  return (
    <Container state={base}>
      <Track state={slider} ref={track}>
        <Fill
          style={{
            width: `${base.getValuePercent(base.values[0]) * 100}%`
          }}
        />
      </Track>

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
