import { LoadingOverlay } from "@mantine/core";
import { defineModuleRoute, useCurrentOcel } from "@ocelescope/core";
import hash from "object-hash";
import { EditorForm } from "../components/Editor";
import { useAppliedEdit } from "../hooks/useAppliedEdit";

const Editor = ({ ocelId }: { ocelId: string }) => {
	const { pipeline, apply, pending } = useAppliedEdit(ocelId);

	return (
		<>
			{pipeline && (
				<EditorForm
					ocelId={ocelId}
					key={hash(pipeline)}
					currentEdit={pipeline}
					onSubmit={apply}
				/>
			)}
			<LoadingOverlay visible={pending} />
		</>
	);
};

const EditorPage = () => {
	const { id: ocelId } = useCurrentOcel();
	return ocelId ? <Editor key={ocelId} ocelId={ocelId} /> : null;
};

export const editorRoute = defineModuleRoute({
	name: "editor",
	label: "Editor",
	component: EditorPage,
	requiresOcel: true,
});
