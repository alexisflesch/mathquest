import { FlatCompat } from '@eslint/eslintrc';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/dist/**',
      '**/archive/**',
      '**/next-env.d.ts',
      // Ignore PWA generated files
      '**/public/sw.js',
      '**/public/workbox-*.js'
    ]
  },
  {
    rules: {
      // Re-enable critical errors we want to fix together
      'react-hooks/rules-of-hooks': 'error',
      'react/no-unescaped-entities': 'error',
      '@next/next/no-html-link-for-pages': 'error',
      'prefer-const': 'error',
      '@typescript-eslint/no-unused-expressions': 'error',
      '@typescript-eslint/no-unsafe-function-type': 'error',

      // Keep some warnings suppressed to reduce noise
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      'no-console': 'off',
      'react-hooks/exhaustive-deps': 'off',
      'prefer-rest-params': 'off',
      'import/no-anonymous-default-export': 'off',
      'eslint-comments/no-unused-disable': 'off'
    }
  },
  // Less aggressive linting for test files
  {
    files: ['**/__tests__/**/*', '**/*.test.*', '**/tests/**/*'],
    rules: {
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-console': 'off'
    }
  }
];
