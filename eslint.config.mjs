import prettierPlugin from "eslint-plugin-prettier";
import typescriptEslintPlugin from "@typescript-eslint/eslint-plugin";
import typescriptEslintParser from "@typescript-eslint/parser";

export default [
  {
    ignores: ["node_modules", "dist"], // Abaikan folder ini
  },
  {
    files: ["src/**/*.ts"], // Targetkan file TypeScript
    languageOptions: {
      parser: typescriptEslintParser, // Gunakan parser TypeScript
      parserOptions: {
        project: "./tsconfig.json", // Path ke file tsconfig.json
        tsconfigRootDir: "./", // Root direktori
        sourceType: "module", // Format ESM
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslintPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // Aturan dasar
      semi: ["error", "always"], // Wajibkan semicolon
      "prettier/prettier": "error", // Aturan Prettier
      "no-console": "off", // Hanya beri peringatan untuk console.log
      "no-unused-vars": "off", // Nonaktifkan default rule
      "@typescript-eslint/no-empty-function": "warn", // Peringatan untuk fungsi kosong
      "@typescript-eslint/explicit-function-return-type": "off", // Tidak perlu return type eksplisit
      "@typescript-eslint/no-explicit-any": "off", // Izinkan penggunaan `any`
      "@typescript-eslint/no-inferrable-types": "off", // Izinkan tipe inferensi otomatis
      "@typescript-eslint/explicit-module-boundary-types": "off", // Tidak wajibkan tipe ekspor fungsi
      "@typescript-eslint/prefer-optional-chain": "warn", // Anjuran untuk optional chaining
      "@typescript-eslint/prefer-nullish-coalescing": "warn", // Anjuran untuk nullish coalescing (`??`)
    },
  },
];