import { defineConfig } from "@hey-api/openapi-ts";
export default defineConfig({
  input: "lib/backend/openapi.json",
  output: {
    path: "lib/backend",
    postProcess: ["eslint", "prettier"],
  },
  plugins: [
    {
      name: "@hey-api/client-axios",
    },
    {
      name: "@hey-api/typescript",
      enums: "javascript",
    },
    {
      name: "@hey-api/sdk",
      operations: {
        strategy: "byTags",
        methodNameBuilder: (operation: any) =>
          operation.id.replaceAll(/_\d+$/g, ""),
        serviceNameBuilder: "{{name}}",
        asClass: true,
      },
    },
  ],
});
