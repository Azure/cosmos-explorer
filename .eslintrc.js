module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  plugins: ["@typescript-eslint", "no-null", "prefer-arrow"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: "module",
  },
  overrides: [
    {
      files: ["**/*.tsx"],
      extends: ["plugin:react/recommended"], // TODO: Add react-hooks
      plugins: ["react"],
    },
    {
      files: ["**/*.{test,spec}.{ts,tsx}"],
      env: {
        jest: true,
      },
      extends: ["plugin:jest/recommended"],
      plugins: ["jest"],
    },
  ],
  rules: {
    "no-console": ["error", { allow: ["error", "warn", "dir"] }],
    curly: "error",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-extraneous-class": "error",
    "no-null/no-null": "error",
    "@typescript-eslint/no-explicit-any": "error",
    "prefer-arrow/prefer-arrow-functions": ["error", { allowStandaloneDeclarations: true }],
    eqeqeq: "error",
    "react/display-name": "off",
    "no-restricted-syntax": [
      "error",
      {
        selector: "CallExpression[callee.object.name='JSON'][callee.property.name='stringify'] Identifier[name=/$err/]",
        message: "Do not use JSON.stringify(error). It will print '{}'",
      },
    ],
  },
};
