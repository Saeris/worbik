import type { GetStaticProps } from "next";
import type { generate } from "../../utils";

export const getStaticProps: GetStaticProps<{
  challenge: string;
}> = async () => {
  const { challenge } = (await (
    await fetch(`http://localhost:3001/api/generate?length=5&count=5`)
  ).json()) as ReturnType<typeof generate>;

  return {
    props: {
      challenge
    },
    revalidate: 60 * 60 * 24 // Revalidate every 24hrs
  };
};
