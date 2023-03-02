export const getDomains = async (): Promise<string[]> => {
  try {
    const { domains } = await (
      await fetch(
        `https://api.vercel.com/v9/projects/${process.env.VERCEL_GIT_REPO_SLUG}/domains`,
        {
          headers: {
            Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`
          },
          method: `get`
        }
      )
    ).json();
    return domains.map(({ name }) => name);
  } catch (err: unknown) {
    if (err instanceof Error) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
    return [];
  }
};
