import type { Size } from "./sizes";

const sizes: Record<string, Size | undefined> = {
  5: 5,
  6: 6,
  7: 7,
  8: 8
};

export const parseSize = (
  size: string = `5x5`
): { width: Size; height: Size } => {
  const [width, height] = size.split(`x`).map((value) => sizes[value]);
  if (width && height) {
    return { width, height };
  }
  throw new Error(`Received invalid size value: "${size}"`);
};
