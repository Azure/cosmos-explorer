module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  plugins: ["@typescript-eslint"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  overrides: [
    {
      files: ["**/*.tsx"],
      plugins: ["react"],
    },
    {
      files: ["**/*.{test,spec}.{ts,tsx}"],
      env: {
        jest: true,
      },
      plugins: ["jest"],
    },
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  rules: {
    "@typescript-eslint/no-unused-vars-experimental": "error",
  },
};
