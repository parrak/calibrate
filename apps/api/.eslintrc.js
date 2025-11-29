module.exports = {
    extends: ['next/core-web-vitals'],
    parserOptions: {
        babelOptions: {
            presets: [require.resolve('next/babel')],
        },
    },
    rules: {
        '@typescript-eslint/no-duplicate-enum-values': 'off',
    },
}
