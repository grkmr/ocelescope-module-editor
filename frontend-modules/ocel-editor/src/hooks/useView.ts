import { keepPreviousData } from "@tanstack/react-query";
import { useRegisterView } from "../api/ocelEditor";
import type { EditAction } from "../types/edit";

/** Query params selecting the log as some steps leave it. */
export type ViewParams = { view_id: string } | { ocel_version: "original" };

const ORIGINAL: ViewParams = { ocel_version: "original" };

/** The original log as `steps` leave it, registered as a view. */
export const useView = (
	ocelId: string,
	steps: EditAction[],
): ViewParams | undefined => {
	const { data } = useRegisterView(ocelId, steps, {
		query: {
			enabled: steps.length > 0,
			placeholderData: keepPreviousData,
			staleTime: Infinity,
		},
	});
	if (steps.length === 0 || data === null) {
		return ORIGINAL;
	}
	return data === undefined ? undefined : { view_id: data };
};

/** `view` as the props of a core picker. */
export const viewProps = (view: ViewParams) =>
	"view_id" in view
		? { viewId: view.view_id }
		: { ocelVersion: "original" as const };
