import { Select, type SelectProps } from "@mantine/core";
import { useEventAttributes, useObjectAttributes } from "@ocelescope/api-base";
import { useCurrentOcel } from "@ocelescope/core";

export const AttributeSelect = ({
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
	const objects = useObjectAttributes(id, undefined, {
		query: { enabled: id != null && entityType === "object" },
	});
	const events = useEventAttributes(id, undefined, {
		query: { enabled: id != null && entityType === "event" },
	});
	const { data, isPending } = entityType === "object" ? objects : events;
	const names = [...new Set((data ?? []).map(({ name }) => name))].sort(
		(a, b) => a.localeCompare(b),
	);

	return (
		<Select
			label="Attribute"
			placeholder={isPending ? "Loading…" : "Search…"}
			searchable
			clearable
			radius={0}
			nothingFoundMessage="Nothing found"
			data={names}
			value={value || null}
			onChange={(value) => onChange(value ?? "")}
			{...props}
		/>
	);
};
