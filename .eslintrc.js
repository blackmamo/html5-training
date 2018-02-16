module.exports = {
    parserOptions: {
        ecmaVersion: 6,
        sourceType: "module",
        ecmaFeatures: {
            jsx: true
        }
    },
    extends: ["google", "prettier"],
    env: { es6: true },
    plugins: ["prettier"],
    rules: {
        "require-jsdoc": [0],
        "max-len": [2, 120],
        "one-var": [0],
        "prettier/prettier": "error"
    }
};
