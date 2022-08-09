import styled, { css } from "styled-components";
import { Slider, SliderThumb, SliderTrack } from "@adaptui/react";

export const Handle = styled(SliderThumb)(
  () => css`
    position: absolute;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 8px;
    height: 14px;
    background: rgb(255, 255, 255);
    border-radius: 25%;
    box-shadow: rgb(0 0 0 / 50%) 0px 1px 3px 0px,
      rgb(0 0 0 / 10%) 0px 1px 2px 0px;
    transform: translate(-50%);
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    touch-action: none;
    cursor: pointer;
  `
);

export const Container = styled(Slider)(
  ({ theme }) => css`
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 14px;
    margin-bottom: calc(1em + 4px);
    touch-action: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;

    &:focus-within {
      ${Handle} {
        outline: 2px solid ${theme.colors.info.border};
      }
    }
  `
);

export const Track = styled(SliderTrack)<{ $fill: string }>(
  ({ theme, $fill }) => css`
    position: relative;
    width: 100%;
    height: 4px;
    background: ${theme.colors.info.bg};
    border-radius: 2px;
    cursor: pointer;

    &:after {
      content: " ";
      position: absolute;
      top: 50%;
      width: ${$fill};
      height: 4px;
      background: ${theme.colors.info.text};
      border-radius: 2px;
      -webkit-transform: translateY(-50%);
      transform: translateY(-50%);
    }
  `
);

export const Label = styled.label(() => css``);

export const Value = styled.label(
  () => css`
    position: absolute;
    top: 14px;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 8px;
    transform: translate(-50%);
    font-size: 1.6rem;
  `
);
