// @ts-check

/** @type {import('postcss-load-config').Config} */
module.exports = {
  plugins: {
    /** @type {import('postcss-nested').Options} */
    "postcss-nested": {},
    /** @type {import('postcss-preset-env').pluginOptions} */
    "postcss-preset-env": {
      features: {
        "relative-color-syntax": { preserve: true }
      }
    }
  }
};
