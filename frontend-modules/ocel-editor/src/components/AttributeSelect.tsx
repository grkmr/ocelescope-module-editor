import { Select, type SelectProps } from "@mantine/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useAttributes } from "../api/ocelEditor";
import type { ViewParams } from "../hooks/useView";

/** An attribute that entities of `types` carry in `view`, or any entity's. */
export const AttributeSelect = ({
	ocelId,
	entityType,
	types = [],
	view,
	value,
	onChange,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	ocelId: string;
	entityType: "object" | "event";
	types?: string[];
	view: ViewParams;
	value: string;
	onChange: (value: string) => void;
}) => {
	const { data, isPending } = useAttributes(
		ocelId,
		{ entity_type: entityType, types, ...view },
		{ query: { placeholderData: keepPreviousData } },
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
