module.exports = {
  root: true,
  env: { 
    browser: true, 
    es2020: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  settings: {
    react: {
      version: 'detect',
    },
  },
  globals: {
    React: 'readonly',
    NodeJS: 'readonly',
    describe: 'readonly',
    it: 'readonly',
    expect: 'readonly',
    beforeEach: 'readonly',
    jest: 'readonly',
    RequestInit: 'readonly'
  },
  rules: {
    // Disable most rules for development
    'react-refresh/only-export-components': 'off',
    '@typescript-eslint/no-unused-vars': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'prefer-const': 'off',
    'no-var': 'off',
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-undef': 'off',
    'react-hooks/exhaustive-deps': 'off',
    'react-hooks/rules-of-hooks': 'error',
    'no-unused-vars': 'off',
    'no-redeclare': 'warn',
  },
} 