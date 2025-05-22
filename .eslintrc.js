module.exports = {
  root: true,
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended'
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  rules: {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }],
    "react/no-unescaped-entities": "error",
    "@next/next/no-img-element": "error",
    "react-hooks/exhaustive-deps": "error",
    "@typescript-eslint/no-empty-interface": "error",
    "react/display-name": "error",
    "no-empty": "error",
    "prefer-const": "error"
  }
};