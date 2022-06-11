import type { GetStaticProps } from "next";
import { Redis } from "@upstash/redis";
import { generate } from "../../utils";

export const getStaticProps: GetStaticProps<{
  challenge: string;
}> = async () => {
  const { challenge, solution } = generate();

  const redis = Redis.fromEnv();
  await redis.set(challenge, solution, { ex: 86400, nx: true });

  return {
    props: {
      challenge
    },
    revalidate: 86400 // Revalidate every 24hrs
  };
};
