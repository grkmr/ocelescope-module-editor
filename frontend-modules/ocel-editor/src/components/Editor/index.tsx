import { OCELViewBuilder, type ViewBuilderLabels } from "@ocelescope/core";
import { useView } from "../../hooks/useView";
import { ACTION_KINDS } from "../Actions";
import { SaveAsOcel } from "./SaveAsOcel";

const LABELS: ViewBuilderLabels = {
	title: "Pipeline",
	note: "The steps run from top to bottom on the original log, each on the log as the steps before it leave it. Saving adds the result to the session as a new OCEL; incomplete steps are skipped.",
	add: "Add edit",
	search: "Search edits",
	noMatch: "No edit matches",
	emptyList: "No edits yet. Add one to start the pipeline.",
	emptyEditor: "Add an edit to the pipeline on the right to start editing.",
	selectHint: "Select a step on the right to edit it.",
};

export const EditorForm = ({ ocelId }: { ocelId: string }) => (
	<OCELViewBuilder
		ocelId={ocelId}
		kinds={ACTION_KINDS}
		useView={useView}
		storageKey="ocel-editor"
		labels={LABELS}
		actions={({ completeSteps }) => (
			<SaveAsOcel ocelId={ocelId} pipeline={completeSteps} />
		)}
	/>
);
