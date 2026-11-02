import type {
	ActionKind,
	EditAction,
	EditActionOf,
	EditActionType,
} from "../../types/edit";
import { AddE2O, AddO2O } from "./AddRelations";
import { MergeObjects } from "./MergeObjects";
import { ActivityRename, ObjectTypeRename } from "./TypeRename";

export const ACTION_KINDS: { [T in EditActionType]: ActionKind<T> } = {
	"rename-object-type": ObjectTypeRename,
	"rename-activity": ActivityRename,
	"add-e2o": AddE2O,
	"add-o2o": AddO2O,
	"merge-objects": MergeObjects,
};

export const kindOf = <T extends EditActionType>(action: EditActionOf<T>) =>
	ACTION_KINDS[action.type as T] as ActionKind<T>;

/** The first thing missing from `action`, if anything is. */
export const problemOf = (action: EditAction) =>
	Object.values(kindOf(action).validate(action)).find(Boolean);

export const completeSteps = (steps: EditAction[]) =>
	steps.filter((step) => problemOf(step) === undefined);
