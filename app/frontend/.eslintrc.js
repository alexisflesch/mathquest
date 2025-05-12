module.exports = {
    extends: ['next/core-web-vitals'],
    plugins: ['react-hooks'],
    rules: {
        '@typescript-eslint/no-unused-vars': 'warn',
        'react-hooks/rules-of-hooks': 'error',
        'react-hooks/exhaustive-deps': 'warn'
    },
    settings: {
        react: {
            version: 'detect'
        }
    },
    ignorePatterns: ['.eslintrc.js', 'next.config.ts']
}
