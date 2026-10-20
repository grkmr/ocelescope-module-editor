import { defineModule } from "@ocelescope/core";
import { SparklesIcon } from "lucide-react";
import { editorRoute } from "./routes/EditorPage";

export default defineModule({
	name: "ocelEditor",
	label: "Ocel Editor",
	description: "A module for creating new OCELs from OCELs",
	authors: [{ name: "Görkem-Emre Öztürk" }],
	icon: SparklesIcon,
	routes: [editorRoute],
});
