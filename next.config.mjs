// @ts-check
export const locales = [`en`];

/**
 * @type {import('next/types').NextConfig}
 */
export const nextConfig = {
  reactStrictMode: true,
  compiler: {
    styledComponents: true
  },
  i18n: {
    locales,
    defaultLocale: `en`
  },
  productionBrowserSourceMaps: process.env.VERCEL_ENV !== `production`,
  swcMinify: true,
  webpack: (config) => {
    config.module.rules.push({
      test: [/(components|utils)\/index.ts$/i],
      sideEffects: false
    });
    config.infrastructureLogging = {
      level: `error`
    };

    return config;
  }
};

const getConfig = async () => {
  const withPWA = (await import(`next-pwa`)).default;
  const runtimeCaching = (await import(`next-pwa/cache.js`)).default;
  return withPWA({
    dest: `public`,
    disable: process.env.NODE_ENV !== `production`,
    runtimeCaching
  })(nextConfig);
};

export default getConfig();
