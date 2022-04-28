import React from "react";

const directions = {
  up: "🔼",
  down: "🔽",
  left: "◀️",
  right: "▶️"
};

interface DirectioonBtnProps extends React.HTMLAttributes<HTMLButtonElement> {
  direction: "up" | "down" | "left" | "right";
}

export const DirectioonBtn: React.FC<DirectioonBtnProps> = ({
  direction,
  onClick = () => {},
  ...props
}) => {
  return (
    <button type="button" onClick={onClick} {...props} className="directionBtn">
      {directions[direction]}
    </button>
  );
};
