// eslint.config.js (Flat Config — Node API + TypeScript)
import js from "@eslint/js";
import unusedImports from "eslint-plugin-unused-imports";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist", "build", "node_modules"] },
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,ts}"],
        plugins: {
            "unused-imports": unusedImports,
        },
        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: globals.node,
        },
        rules: {
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": "error",
            "unused-imports/no-unused-imports": "error",
            "no-undef": "error",
        },
    }
);
