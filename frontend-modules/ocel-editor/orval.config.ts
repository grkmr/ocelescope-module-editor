import { defineConfig } from "@ocelescope/api-config";

// `defineConfig` applies Ocelescope's shared Orval defaults (react-query over
// axios, input ./openapi.json, and the customFetch mutator in src/lib/fetcher.ts).
// You only provide the output target.
export default defineConfig({
  ocelEditor: {
    output: {
      target: "./src/api/ocelEditor.ts",
      override: {
        operations: {
          // POSTs so the pipeline can go in the body, but they only read
          types: { query: { useQuery: true } },
          attributes: { query: { useQuery: true } },
        },
      },
    },
  },
});
