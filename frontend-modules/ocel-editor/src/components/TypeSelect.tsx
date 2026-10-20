import { MultiSelect, type MultiSelectProps } from "@mantine/core";
import { useCurrentOcel } from "@ocelescope/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useTypes } from "../api/ocelEditor";
import { useDebouncedSteps } from "../hooks/useDebouncedSteps";
import type { EditAction } from "../types/edit";

/** Object types or activities of the current OCEL, any number of them. */
export const TypeSelect = ({
	entityType,
	steps,
	...props
}: Omit<MultiSelectProps, "data"> & {
	entityType: "object" | "event";
	steps?: EditAction[];
}) => {
	const { id } = useCurrentOcel();
	const { data, isPending } = useTypes(
		id,
		useDebouncedSteps(steps),
		{ entity_type: entityType },
		{ query: { enabled: id != null, placeholderData: keepPreviousData } },
	);

	return (
		<MultiSelect
			label={entityType === "object" ? "Object types" : "Activities"}
			placeholder={isPending ? "Loading…" : "Search…"}
			searchable
			clearable
			radius={0}
			nothingFoundMessage="Nothing found"
			data={Object.keys(data ?? {}).sort((a, b) => a.localeCompare(b))}
			{...props}
		/>
	);
};
