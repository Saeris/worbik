import { Button } from "ariakit/button";
import { Dialog } from "ariakit/dialog";
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
    position: fixed;
    top: 50%;
    left: 50%;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 0.75em;
    width: calc(100% - 32px);
    max-width: 40ch;
    max-height: 80%;
    padding: 16px;
    border: 1px solid hsl(204, 20%, 88%);
    border-radius: 8px;
    background-color: hsl(204, 20%, 100%);
    color: hsl(204, 10%, 10%);
    overflow: auto;
    font-size: ${theme.sizes.label};
    font-weight: 300;
    filter: drop-shadow(0 16px 24px rgba(0, 0, 0, 15%));
    transform: translate(-50%, -60%);
  `
);
