import { Form, useFormState } from "ariakit";
import React from "react";
import { Slider } from "../../../components/Slider";
import type { PuzzleSchema } from "../../../utils";
import { Container } from "./elements";

export interface SettingsProps {
  initial?: PuzzleSchema;
}

export const Settings: React.FC<SettingsProps> = ({
  initial = { width: 5, height: 5 }
}) => {
  const state = useFormState({
    defaultValues: initial
  });
  return (
    <Container>
      <Form state={state}>
        <Slider
          aria-label={`Puzzle Width`}
          name="width"
          state={state}
          minValue={5}
          maxValue={8}
        />
        <Slider
          aria-label={`Puzzle Height`}
          name="height"
          state={state}
          minValue={5}
          maxValue={8}
        />
      </Form>
    </Container>
  );
};
