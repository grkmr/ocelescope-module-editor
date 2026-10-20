import { Select, type SelectProps } from "@mantine/core";
import { useEventCounts, useObjectCounts } from "@ocelescope/api-base";
import { useCurrentOcel } from "@ocelescope/core";

/** Object types or activities of the current OCEL. */
export const TypeSelect = ({
	entityType,
	value,
	onChange,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	entityType: "object" | "event";
	value: string;
	onChange: (value: string) => void;
}) => {
	const { id } = useCurrentOcel();
	const isObject = entityType === "object";
	const objects = useObjectCounts(id, undefined, {
		query: { enabled: id != null && isObject },
	});
	const events = useEventCounts(id, undefined, {
		query: { enabled: id != null && !isObject },
	});
	const { data, isPending } = isObject ? objects : events;

	return (
		<Select
			label={isObject ? "Object type" : "Activity"}
			placeholder={isPending ? "Loading…" : "Search…"}
			searchable
			clearable
			radius={0}
			nothingFoundMessage="Nothing found"
			data={Object.keys(data ?? {}).sort((a, b) => a.localeCompare(b))}
			value={value || null}
			onChange={(value) => onChange(value ?? "")}
			{...props}
		/>
	);
};
