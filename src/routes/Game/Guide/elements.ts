import styled, { css } from "styled-components";

export const ModalHeader = styled.header(
  ({ theme }) => css`
    display: flex;
    justify-content: space-between;
    padding-bottom: 8px;
    margin-bottom: 8px;
    border-bottom: 1px solid ${theme.colors.neutral.border};

    button {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 44px;
      height: 44px;
      border: 0.5px solid ${theme.colors.neutral.border};
      border-radius: 2px;
      background: ${theme.colors.neutral.bg};
      color: ${theme.colors.neutral.text};
      cursor: pointer;

      &:hover,
      &:focus {
        background: ${theme.colors.info.bg};
        border-color: ${theme.colors.info.border};
        color: ${theme.colors.info.text};
        outline: none;
      }
    }
  `
);
