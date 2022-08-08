import styled from "styled-components";

export const Overlay = styled.g`
  opacity: 0.25;
  transition: opacity 1s ease-in-out;

  &:hover {
    opacity: 0.75;
  }
`;
