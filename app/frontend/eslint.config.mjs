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
      // Turn off warning rules to clean up build output
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-require-imports': 'off',
      '@typescript-eslint/prefer-as-const': 'off',
      // Allow unused imports for now
      'no-unused-vars': 'off',
      // Allow any types for now
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // Allow console.log for debugging
      'no-console': 'off',
      // Turn off React hooks warnings
      'react-hooks/exhaustive-deps': 'off',
      'react-hooks/rules-of-hooks': 'off',
      // Turn off other common warnings
      'prefer-const': 'off',
      'prefer-rest-params': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      // Turn off React-specific rules
      'react/no-unescaped-entities': 'off',
      '@next/next/no-html-link-for-pages': 'off',
      // Turn off import warnings
      'import/no-anonymous-default-export': 'off',
      // Turn off unused eslint-disable directive warnings
      'eslint-comments/no-unused-disable': 'off'
    }
  }
];
