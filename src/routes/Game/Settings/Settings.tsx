import { Form, useFormState } from "ariakit";
import React from "react";
import { Slider } from "../../../components/Slider";
import { Container } from "./elements";

export const Settings: React.FC = () => {
  const state = useFormState({
    defaultValues: {
      width: 5,
      height: 5
    }
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
      <pre>{JSON.stringify(state.values, null, 2)}</pre>
    </Container>
  );
};
