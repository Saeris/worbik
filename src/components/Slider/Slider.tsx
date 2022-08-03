import React from "react";
import type {
  SliderBaseStateProps,
  SliderThumbStateProps
} from "@adaptui/react";
import {
  useSliderBaseState,
  useSliderState,
  useSliderThumbState
} from "@adaptui/react";
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

export const Slider: React.FC<SliderBaseStateProps> = ({
  orientation,
  isDisabled,
  ...props
}) => {
  const state = useSliderBaseState({ orientation, isDisabled, ...props });
  const slider = useSliderState({ orientation, isDisabled, ...props, state });

  return (
    <Container state={slider}>
      <Track state={slider}>
        <Fill
          style={{
            width: `${state.getValuePercent(state.values[0]) * 100}%`
          }}
        />
      </Track>

      <Thumb
        index={0}
        state={state}
        orientation={orientation}
        isDisabled={isDisabled}
        trackRef={slider.trackRef}
        aria-label="Thumb"
      />
    </Container>
  );
};
