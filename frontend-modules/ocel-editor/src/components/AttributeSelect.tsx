import { Select, type SelectProps } from "@mantine/core";
import { useCurrentOcel } from "@ocelescope/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useAttributes } from "../api/ocelEditor";
import { useDebouncedSteps } from "../hooks/useDebouncedSteps";
import type { EditAction } from "../types/edit";

export const AttributeSelect = ({
	entityType,
	types = [],
	steps,
	value,
	onChange,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	entityType: "object" | "event";
	types?: string[];
	steps?: EditAction[];
	value: string;
	onChange: (value: string) => void;
}) => {
	const { id } = useCurrentOcel();
	const { data, isPending } = useAttributes(
		id,
		useDebouncedSteps(steps),
		{ entity_type: entityType, types },
		{ query: { enabled: id != null, placeholderData: keepPreviousData } },
	);

	return (
		<Select
			label="Attribute"
			placeholder={isPending ? "Loading…" : "Search…"}
			searchable
			clearable
			radius={0}
			nothingFoundMessage="Nothing found"
			data={data ?? []}
			value={value || null}
			onChange={(value) => onChange(value ?? "")}
			{...props}
		/>
	);
};
