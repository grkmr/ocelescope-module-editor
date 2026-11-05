import type { OcelescopeConfig } from "@ocelescope/core";
import filter from "@ocelescope/filter";
import logOverview from "@ocelescope/log-overview";
import management from "@ocelescope/management";
import ocelEditorModule from "@ocelescope/ocel-editor";
import ocelot from "@ocelescope/ocelot";

const main = [management, ocelEditorModule];
const utilities = [logOverview, filter, ocelot];

// `pnpm run add:frontend` adds local frontend modules here.
export default {
	modules: [...main, ...utilities],
	navbarGroups: [
		{ modulesNames: main.map(({ name }) => name) },
		{ title: "Utility", modulesNames: utilities.map(({ name }) => name) },
	],
} satisfies OcelescopeConfig;
