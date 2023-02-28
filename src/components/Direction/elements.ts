import styled, { css } from "styled-components";
import { Button as Base } from "ariakit/button";

export const Button = styled(Base)<{ $orientation: boolean }>(
  ({ theme, $orientation = false }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    padding: 0;
    width: ${$orientation ? `48` : `24`}px;
    height: ${$orientation ? `24` : `48`}px;
    background: ${theme.colors.neutral.bg};
    border: 0.5px solid ${theme.colors.neutral.border};
    border-radius: 2px;
    color: ${theme.colors.neutral.text};
    font-size: 24px;
    cursor: pointer;

    &:hover {
      background: ${theme.colors.info.bg};
      border-color: ${theme.colors.info.border};
      color: ${theme.colors.info.text};
    }
  `
);
