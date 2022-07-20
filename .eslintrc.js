// @ts-check

/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  extends: ["@saeris/eslint-config"],
  ignorePatterns: [`*.js`, `*.d.ts`],
  rules: {
    "multiline-ternary": "off"
  }
};
