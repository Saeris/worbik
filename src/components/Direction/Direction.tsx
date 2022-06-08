import React from "react";
import {
  MdOutlineKeyboardArrowDown as Down,
  MdOutlineKeyboardArrowUp as Up,
  MdOutlineKeyboardArrowLeft as Left,
  MdOutlineKeyboardArrowRight as Right
} from "react-icons/md";
import { Button } from "./elements";

const directions = {
  up: <Up />,
  down: <Down />,
  left: <Left />,
  right: <Right />
};

interface DirectionProps extends React.HTMLAttributes<HTMLButtonElement> {
  direction: "up" | "down" | "left" | "right";
}

export const Direction: React.FC<DirectionProps> = ({
  direction,
  onClick = (): void => {},
  ...props
}) => (
  <Button
    type="button"
    tabIndex={-1}
    onClick={onClick}
    {...props}
    $orientation={[`up`, `down`].includes(direction)}
  >
    {directions[direction]}
  </Button>
);
