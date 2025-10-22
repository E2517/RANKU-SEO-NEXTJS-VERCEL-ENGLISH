import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // Deshabilitar reglas que causan errores de compilación o son muy estrictas
      "@typescript-eslint/no-explicit-any": "off", // Permite 'any' temporalmente
      "@typescript-eslint/no-unused-vars": "warn", // Cambia a 'warn' para que no fallen los builds
      "prefer-const": "off", // Permite 'let' aunque no se reasigne
      "@typescript-eslint/no-require-imports": "off", // Permite 'require()' si es necesario
      "@typescript-eslint/no-empty-object-type": "off", // Permite interfaces y tipos vacíos
      "react/no-unescaped-entities": "off", // Permite comillas directas en JSX
      // Otras reglas que puedes querer deshabilitar si causan problemas:
      // "react-hooks/exhaustive-deps": "warn", // Puede causar warnings, pero no errores de build
    }
  }
];

export default eslintConfig;