import { defineModuleRoute, useCurrentOcel } from "@ocelescope/core";
import { EditorForm } from "../components/Editor";

const EditorPage = () => {
	const { id: ocelId } = useCurrentOcel();
	return ocelId ? <EditorForm key={ocelId} ocelId={ocelId} /> : null;
};

export const editorRoute = defineModuleRoute({
	name: "editor",
	label: "Editor",
	component: EditorPage,
	requiresOcel: true,
});
