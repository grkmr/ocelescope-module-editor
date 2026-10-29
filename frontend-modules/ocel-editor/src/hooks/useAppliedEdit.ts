import { useLocalStorage } from "@mantine/hooks";
import { useInvalidate } from "@ocelescope/core";
import { useGetActiveEdit, useSetEdit } from "../api/ocelEditor";
import type { EditAction } from "../types/edit";

type Applied = { pipeline: EditAction[]; viewId: string };

/**
 * The pipeline applied to `ocelId`, and a way to apply another.
 *
 * The pipeline is kept in the browser next to the view it was applied as; it
 * holds only while that view is still the OCEL's active one -- another module,
 * like the filter, may have replaced it since.
 */
export const useAppliedEdit = (ocelId: string) => {
	const [applied, setApplied] = useLocalStorage<Applied | null>({
		key: `ocelescope-ocel-editor:${ocelId}`,
		defaultValue: null,
		getInitialValueInEffect: false,
	});
	const { data: activeId, refetch } = useGetActiveEdit(ocelId);
	const invalidate = useInvalidate();

	const { mutate, status } = useSetEdit({
		mutation: {
			onSuccess: async (viewId, { data: pipeline }) => {
				setApplied(viewId ? { pipeline, viewId } : null);
				await refetch();
				await invalidate(["ocels"]);
			},
		},
	});

	const pipeline =
		activeId === undefined
			? undefined
			: activeId !== null && applied?.viewId === activeId
				? applied.pipeline
				: [];

	return {
		pipeline,
		apply: (pipeline: EditAction[]) => mutate({ ocelId, data: pipeline }),
		pending: status === "pending",
	};
};
