export const parseSize = (
  size: string = `5x5`
): { width: number; height: number } | undefined => {
  const parsed = /^(?<width>\d)x(?<height>\d)$/.exec(size);
  if (
    typeof parsed?.groups?.width === `string` &&
    typeof parsed.groups.height === `string`
  ) {
    const width = parseInt(parsed.groups.width, 10);
    const height = parseInt(parsed.groups.height, 10);
    const valid = [5, 6, 7, 8];
    if (valid.includes(width) && valid.includes(height)) {
      return {
        width,
        height
      };
    }
  }
};
