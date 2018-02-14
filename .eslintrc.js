module.exports = {
  env: {
    browser: true,
    es6: true,
    webextensions: true
  },
  extends: [
    "eslint:recommended",
    "plugin:mozilla/recommended"
  ],
  parserOptions: {
    ecmaVersion: 2017
  },
  plugins: [
    "mozilla"
  ],
  root: true,
  rules: {
    "mozilla/use-chromeutils-import": "off",

    "eqeqeq": "error",
    "no-var": "error",
    "prefer-const": "error",
    "quotes": ["error", "double"],
  }
};
