import {
	Anchor,
	Group,
	MultiSelect,
	type MultiSelectProps,
} from "@mantine/core";
import { useCurrentOcel } from "@ocelescope/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useTypes } from "../api/ocelEditor";
import { useDebouncedSteps } from "../hooks/useDebouncedSteps";
import type { EditAction } from "../types/edit";

/** Object types or activities of the current OCEL, any number of them. */
export const TypeSelect = ({
	entityType,
	steps,
	value = [],
	onChange,
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
	const types = Object.keys(data ?? {}).sort((a, b) => a.localeCompare(b));
	const allPicked = types.length > 0 && types.every((t) => value.includes(t));

	return (
		<MultiSelect
			label={
				<Group justify="space-between" wrap="nowrap">
					{entityType === "object" ? "Object types" : "Activities"}
					<Anchor
						component="button"
						type="button"
						size="xs"
						disabled={types.length === 0}
						onClick={() => onChange?.(allPicked ? [] : types)}
					>
						{allPicked ? "Clear" : "Select all"}
					</Anchor>
				</Group>
			}
			labelProps={{ w: "100%" }}
			placeholder={isPending ? "Loading…" : "Search…"}
			searchable
			clearable
			radius={0}
			nothingFoundMessage="Nothing found"
			data={types}
			value={value}
			onChange={onChange}
			styles={{ pillsList: { flexWrap: "nowrap", overflow: "hidden" } }}
			{...props}
		/>
	);
};
