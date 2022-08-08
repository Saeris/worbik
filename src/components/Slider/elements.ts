import styled, { css } from "styled-components";
import { Slider, SliderThumb, SliderTrack } from "@adaptui/react";

export const Container = styled(Slider)(
  () => css`
    position: relative;
    display: inline-block;
    width: 100%;
    touch-action: none;
    -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    outline: 0px;
  `
);

export const Track = styled(SliderTrack)(
  () => css`
    position: relative;
    width: 100%;
    padding: 7px 0 7px 0;
    cursor: pointer;

    &::before {
      content: " ";
      width: 100%;
      height: 4px;
      background: rgb(226, 232, 240);
      border-radius: 0.125rem;
    }
  `
);

export const Fill = styled.div(
  () => css`
    position: absolute;
    height: 4px;
    background: rgb(49, 130, 206);
    top: 50%;
    -webkit-transform: translateY(-50%);
    transform: translateY(-50%);
    border-radius: 0.125rem;
  `
);

export const HandleGroup = styled.div(
  () => css`
    position: absolute;
    top: 2px;
    z-index: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  `
);

export const Handle = styled(SliderThumb)(
  () => css`
    width: 14px;
    height: 14px;
    background: rgb(255, 255, 255);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    box-shadow: rgb(0 0 0 / 50%) 0px 1px 3px 0px,
      rgb(0 0 0 / 10%) 0px 1px 2px 0px;
    -webkit-user-select: none;
    -ms-user-select: none;
    user-select: none;
    touch-action: none;
    cursor: pointer;
  `
);

export const Value = styled.div(
  () => css`
    margin: 8px 0 0 0;
  `
);
