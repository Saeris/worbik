// @ts-check
const withPWA = require("next-pwa");
const runtimeCaching = require("next-pwa/cache");

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  compiler: {
    styledComponents: true
  },
  i18n: {
    locales: ["en"],
    defaultLocale: "en"
  },
  productionBrowserSourceMaps: true
};

module.exports = withPWA({
  pwa: {
    dest: "public",
    runtimeCaching
  },
  ...nextConfig
});
