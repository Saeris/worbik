import { Button, Dialog } from "ariakit";
import styled, { css } from "styled-components";

export const Open = styled(Button)(
  ({ theme }) => css`
    margin: 0;
    padding: 0;
    border: none;
    background: none;
    color: ${theme.colors.info.text};
    cursor: pointer;

    &:hover {
      filter: brightness(2);
    }

    &:focus {
      filter: brightness(2);
      outline: none;
    }
  `
);

export const Container = styled(Dialog)(
  ({ theme }) => css`
    max-width: calc(80% - 32px);
    max-height: calc(80% - 32px);
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 50;
    display: flex;
    width: 100%;
    flex-direction: column;
    gap: 1rem;
    overflow: auto;
    padding: 16px;
    border: 1px solid hsl(204, 20%, 88%);
    border-radius: 8px;
    background-color: hsl(204, 20%, 100%);
    color: hsl(204, 10%, 10%);
    font-size: ${theme.sizes.label};
    filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 15%));
    transform: translate(-50%, -60%);
  `
);
