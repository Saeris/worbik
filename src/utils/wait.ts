// eslint-disable-next-line no-undef
export const wait = async (ms: number): Promise<NodeJS.Timeout> =>
  // eslint-disable-next-line no-promise-executor-return
  new Promise((resolve) => setTimeout(resolve, ms));
