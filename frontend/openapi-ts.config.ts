import { defineConfig } from "@hey-api/openapi-ts";
export default defineConfig({
  input: "lib/backend/openapi.json",
  output: {
    path: "lib/backend",
    format: "prettier",
    lint: "eslint",
  },
  plugins: [
    {
      name: "@hey-api/client-axios",
    },
    {
      name: "@hey-api/typescript",
      enums: "javascript",
    },
    // {
    //   name: "@hey-api/sdk",
    //   asClass: true,
    //   serviceNameBuilder: "{{name}}",
    //   methodNameBuilder: (operation: any) => {
    //     return operation.id.replaceAll(/_\d+$/g, "");
    //   },
    // },
  ],
});