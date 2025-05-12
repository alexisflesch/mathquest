import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: FlatCompat.recommendedConfig,
});

export default [
    {
        files: ["**/*.{js,ts}"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
        },
        rules: {
            "@typescript-eslint/no-unused-vars": "warn",
        },
    },
];
