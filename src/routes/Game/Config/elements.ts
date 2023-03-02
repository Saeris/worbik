import Link from "next/link";
import styled, { css } from "styled-components";

export const Frame = styled.article(
  ({ theme }) => css`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: ${theme.spacing[16]};
    padding: ${theme.spacing[8]};
  `
);

export const SizeButton = styled(Link)(
  ({ theme }) => css`
    display: flex;
    justify-content: center;
    align-items: center;
    padding: ${theme.spacing[12]} ${theme.spacing[8]};
    border: 0.5px solid ${theme.colors.neutral.border};
    border-radius: 2px;
    background: ${theme.colors.neutral.bg};
    color: ${theme.colors.neutral.text};
    font-size: ${theme.spacing[20]};
    line-height: ${theme.spacing[24]};
    letter-spacing: 0.25em;
    cursor: pointer;

    &:hover,
    &:focus {
      background: ${theme.colors.info.bg};
      border-color: ${theme.colors.info.border};
      color: ${theme.colors.info.text};
      outline: none;
    }
  `
);
