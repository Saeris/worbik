import styled, { css } from "styled-components";

export const Main = styled.main(
  ({ theme }) => css`
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 4ch;
    padding: 16px;
    height: 100%;
    color: ${theme.colors.neutral.text};
    font-size: 24px;
    font-family: ${theme.fonts.body};

    p {
      max-width: 30ch;
      font-weight: 300;
    }
  `
);

export const Title = styled.h1(
  ({ theme }) => css`
    display: inline-flex;
    gap: 0.5ch;
    align-items: baseline;
    font-size: ${theme.sizes.title};

    button {
      font-size: ${theme.sizes.header};
    }
  `
);

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
