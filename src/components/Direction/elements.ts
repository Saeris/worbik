import styled, { css } from "styled-components";
import { Button as Base } from "ariakit/button";

export const Button = styled(Base)<{ $orientation: boolean }>(
  ({ theme, $orientation = false }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    border: none;
    padding: 0;
    width: ${$orientation ? `44` : `22`}px;
    height: ${$orientation ? `22` : `44`}px;
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
