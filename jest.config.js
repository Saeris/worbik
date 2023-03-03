// @ts-check
const { name } = require(`./package.json`);

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
module.exports = {
  displayName: name,
  coverageDirectory: `./coverage/`,
  collectCoverage: true,
  collectCoverageFrom: [
    // include
    `./src/**/*.ts`,
    `./src/**/*.tsx`,
    // exclude
    `!**/__mocks__/**/*`,
    `!**/__tests__/**/*`,
    `!**/__stories__/**/*`,
    `!**/node_modules/**`
  ],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": ["babel-jest", { presets: ["next/babel"] }]
  },
  testEnvironment: `node`,
  verbose: true
};
