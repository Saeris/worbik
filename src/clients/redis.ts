import { Redis } from "@upstash/redis";

// https://docs.upstash.com/redis/sdks/javascriptsdk/environments
export const redis = Redis.fromEnv();
