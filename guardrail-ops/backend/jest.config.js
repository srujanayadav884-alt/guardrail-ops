/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: ".",
  testMatch: ["<rootDir>/src/**/*.test.ts"],
  clearMocks: true,
  setupFiles: ["<rootDir>/jest.setup.js"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/server.ts",
    "!src/db/**",
    "!src/**/*.test.ts",
  ],
};
