import { notifications } from "@mantine/notifications";
import type { UseView } from "@ocelescope/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRegisterView } from "../api/ocelEditor";
import { apiError } from "../lib/apiError";
import type { EditAction } from "../types/edit";

/** The view of the log as `steps` leave it: `null` for the original log,
 * `undefined` while it is being registered or could not be. */
export const useView: UseView<EditAction> = (ocelId, steps) => {
	const { data, error } = useRegisterView(ocelId, steps, {
		query: {
			enabled: steps.length > 0,
			placeholderData: keepPreviousData,
			staleTime: Infinity,
			retry: false,
		},
	});

	useEffect(() => {
		if (error) {
			notifications.show({
				id: "ocel-editor-view",
				color: "red",
				title: "Could not load the log as the steps before leave it",
				message: apiError(error, "The backend refused the pipeline."),
			});
		}
	}, [error]);

	return steps.length === 0 ? null : data;
};
