import { styled, css } from "styled-components";

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
      text-align: center;
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
