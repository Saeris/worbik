import styled, { css } from "styled-components";

export const Container = styled.div(
  () => css`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 200px;
  `
);
