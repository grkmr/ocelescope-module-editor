import type { OcelescopeConfig } from "@ocelescope/core";
import management from "@ocelescope/management";
import ocelEditorModule from "@ocelescope/ocel-editor";

// `pnpm run add:frontend` adds local frontend modules here.
export default {
	modules: [management, ocelEditorModule],
} satisfies OcelescopeConfig;
