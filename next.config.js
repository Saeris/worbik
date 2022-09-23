// @ts-check
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

/**
 * @type {import('next/types').NextConfig}
 */
const nextConfig = {
  compiler: {
    styledComponents: true
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en"
  },
  experimental: {
    runtime: "experimental-edge",
    images: { allowFutureImage: true }
  },
  webpack: (config) => {
    config.module.rules.push({
      test: [/(components|utils)\/index.ts$/i],
      sideEffects: false
    });

    return config;
  }
};

module.exports = withPWA({
  pwa: {
    dest: "public",
    disable: process.env.NODE_ENV !== "production",
    runtimeCaching
  },
  ...nextConfig
});
