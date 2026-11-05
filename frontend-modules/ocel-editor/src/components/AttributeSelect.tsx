import { Select, type SelectProps } from "@mantine/core";
import { viewParams } from "@ocelescope/core";
import { keepPreviousData } from "@tanstack/react-query";
import { useAttributes } from "../api/ocelEditor";

/** An attribute that entities of `types` carry in the view `viewId`, or any entity's. */
export const AttributeSelect = ({
	ocelId,
	entityType,
	types = [],
	viewId,
	value,
	onChange,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	ocelId: string;
	entityType: "object" | "event";
	types?: string[];
	viewId: string | null;
	value: string;
	onChange: (value: string) => void;
}) => {
	const { data, isPending } = useAttributes(
		ocelId,
		{ entity_type: entityType, types, ...viewParams(viewId) },
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
