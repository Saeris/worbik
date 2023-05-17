export const parseSize = (
  size: string = `5x5`
): { width: number; height: number } => {
  const [width, height] = size.split(`x`);
  const sizes = {
    5: 5,
    6: 6,
    7: 7,
    8: 8
  } as const;
  if (sizes[width] && sizes[height]) {
    return {
      width: sizes[width],
      height: sizes[height]
    };
  }
  throw new Error(`Received invalid size value: "${size}"`);
};
