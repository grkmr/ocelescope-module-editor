import { keepPreviousData } from "@tanstack/react-query";
import { useRegisterView } from "../api/ocelEditor";
import type { EditAction } from "../types/edit";

export type ViewParams = { view_id: string } | { ocel_version: "original" };

const ORIGINAL: ViewParams = { ocel_version: "original" };

export const useView = (
	ocelId: string,
	steps: EditAction[],
): { data?: ViewParams; isPending: boolean; error: unknown } => {
	const { data, isPending, error } = useRegisterView(ocelId, steps, {
		query: {
			enabled: steps.length > 0,
			placeholderData: keepPreviousData,
			staleTime: Infinity,
			retry: false,
		},
	});
	if (steps.length === 0 || data === null) {
		return { data: ORIGINAL, isPending: false, error: null };
	}
	return {
		data: data === undefined ? undefined : { view_id: data },
		isPending,
		error,
	};
};

export const viewProps = (view: ViewParams) =>
	"view_id" in view
		? { viewId: view.view_id }
		: { ocelVersion: "original" as const };
