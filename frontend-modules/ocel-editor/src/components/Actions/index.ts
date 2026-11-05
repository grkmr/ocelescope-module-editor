import type { StepKinds } from "@ocelescope/core";
import type { EditAction } from "../../types/edit";
import { AddE2O, AddO2O } from "./AddRelations";
import { MergeObjects } from "./MergeObjects";
import { ActivityRename, ObjectTypeRename } from "./TypeRename";

export const ACTION_KINDS: StepKinds<EditAction> = {
	"rename-object-type": ObjectTypeRename,
	"rename-activity": ActivityRename,
	"add-e2o": AddE2O,
	"add-o2o": AddO2O,
	"merge-objects": MergeObjects,
};
