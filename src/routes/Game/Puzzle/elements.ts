import styled, { css } from "styled-components";
import {
  Composite,
  CompositeGroup,
  CompositeRow,
  CompositeItem
} from "ariakit/composite";

export const Container = styled(Composite)(
  () => css`
    display: flex;
    flex-direction: column;
    gap: 4ch;
    align-items: center;
    font-size: 24px;
  `
);

export const Grid = styled(CompositeGroup)(
  () => css`
    display: flex;
    flex-direction: column;
    text-align: center;
    gap: 2px;
    touch-action: manipulation;
  `
);

export const Row = styled(CompositeRow)(
  () => css`
    display: flex;
    justify-content: center;
    gap: 2px;
  `
);

export const Character = styled(CompositeItem)<{
  $hint: boolean;
  $correct: boolean;
}>(
  ({ theme, $hint = false, $correct = false }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    padding: 0;
    width: 48px;
    height: 48px;
    background: ${theme.colors.neutral.bg};
    border: 0.5px solid ${theme.colors.neutral.border};
    border-radius: 2px;
    color: ${theme.colors.neutral.text};
    font-size: 24px;
    box-sizing: border-box;
    user-select: none;
    touch-action: manipulation;

    &:focus {
      background: ${theme.colors.info.bg};
      border-color: ${theme.colors.info.border};
      color: ${theme.colors.info.text};
      outline: none;
    }

    ${$hint
      ? `
      background: ${theme.colors.warning.bg};
      border-color: ${theme.colors.warning.border};
      color: ${theme.colors.warning.text};
    `
      : ``}

    ${$correct
      ? `
      background: ${theme.colors.success.bg};
      border-color: ${theme.colors.success.border};
      color: ${theme.colors.success.text};
    `
      : ``}
  `
);
