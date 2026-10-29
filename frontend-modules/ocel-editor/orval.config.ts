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
					// A POST so the steps can go in the body, but it only registers a view
					registerView: { query: { useQuery: true, useMutation: false } },
				},
			},
		},
	},
});
