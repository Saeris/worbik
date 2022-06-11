import type { GetStaticProps } from "next";
import { Redis } from "@upstash/redis";
import { generate } from "../../utils";

export const getStaticProps: GetStaticProps<{
  challenge: string;
}> = async () => {
  const { challenge, solution } = generate();

  const redis = Redis.fromEnv();
  await redis.set(challenge, solution);

  return {
    props: {
      challenge
    },
    revalidate: 60 * 60 * 24 // Revalidate every 24hrs
  };
};
