module.exports = {
  transform: {
    '^.+\\.[jt]sx?$': `<rootDir>/jest-preprocess.js`,
  },
  moduleNameMapper: {
    '.+\\.(css|styl|less|sass|scss)$': `identity-obj-proxy`,
    '.+\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$': `<rootDir>/__mocks__/file-mock.js`,
  },
  testPathIgnorePatterns: [
    `node_modules`,
    `\\.cache`,
    `<rootDir>.*/public`,
    `<rootDir>/tests/e2e/`, // Explicitly exclude e2e tests
    `<rootDir>/test-results/`, // Exclude Playwright test results
  ],
  transformIgnorePatterns: [
    `node_modules/(?!(gatsby|gatsby-script|gatsby-link|p5)/)`,
  ],
  globals: {
    __PATH_PREFIX__: ``,
  },
  testEnvironmentOptions: {
    url: `http://localhost`,
  },
  testEnvironment: `jsdom`,
  setupFiles: [`<rootDir>/loadershim.js`],
  setupFilesAfterEnv: [`<rootDir>/setup-test-env.js`],
}
