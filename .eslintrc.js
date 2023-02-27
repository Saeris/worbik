// @ts-check

/**
 * @type {import("eslint").Linter.Config}
 */
module.exports = {
  extends: [
    `@saeris/eslint-config/base`,
    `@saeris/eslint-config/next`,
    `@saeris/eslint-config/react`,
    `@saeris/eslint-config/jest`,
    `@saeris/eslint-config/type-aware`,
    `@saeris/eslint-config/typescript`
  ],
  ignorePatterns: [`.next/**/*`, `*.js`, `*.d.ts`],
  rules: {
    "multiline-ternary": "off",
    "react/require-default-props": "off"
  }
};
