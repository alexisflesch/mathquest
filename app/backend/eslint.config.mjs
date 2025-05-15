import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import parser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: FlatCompat.recommendedConfig,
});

export default [
    {
        ignores: ["dist/", "node_modules/"]
    },
    ...compat.extends("eslint:recommended"),
    {
        files: ["**/*.ts"],
        plugins: {
            "@typescript-eslint": tsPlugin,
            "prettier": prettierPlugin
        },
        languageOptions: {
            parser: parser,
            parserOptions: {
                ecmaVersion: "latest",
                sourceType: "module",
                project: "./tsconfig.json"
            }
        },
        rules: {
            ...tsPlugin.configs["eslint-recommended"].rules,
            ...tsPlugin.configs["recommended"].rules,
            "prettier/prettier": "error",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/explicit-module-boundary-types": "off"
        }
    },
    {
        // Global rules for all files if needed, or specific overrides
        rules: {
            // Example: enforce LF line endings
            // "linebreak-style": ["error", "unix"]
        }
    }
];
