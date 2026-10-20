import { defineModuleRoute } from "@ocelescope/core";
import OcelEditor from "../components/Editor";

const EditorPage = () => {
	return <OcelEditor />;
};

export const editorRoute = defineModuleRoute({
	name: "editor",
	label: "Editor",
	component: EditorPage,
	requiresOcel: true,
});
