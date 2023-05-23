// @ts-check
import withPWA from "next-pwa";
import runtimeCaching from "next-pwa/cache.js";

/**
 * @type {import('next/types').NextConfig}
 */
export const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true
  },
  i18n: {
    locales: [`en`],
    defaultLocale: `en`
  },
  productionBrowserSourceMaps: process.env.VERCEL_ENV !== `production`,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: [/(components|utils)\/index.ts$/i],
      sideEffects: false
    });

    return config;
  }
};

export default withPWA({
  dest: `public`,
  disable: process.env.NODE_ENV !== `production`,
  runtimeCaching
})(nextConfig);
