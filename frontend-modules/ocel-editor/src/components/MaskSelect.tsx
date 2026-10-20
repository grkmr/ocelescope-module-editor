import { Select, type SelectProps } from "@mantine/core";
import { useMasks } from "../api/ocelEditor";

/** The OCEL masks of the session. */
export const MaskSelect = ({
	value,
	onChange,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	value: string;
	onChange: (value: string) => void;
}) => {
	const { data, isPending } = useMasks();

	return (
		<Select
			label="Mask"
			placeholder={isPending ? "Loading…" : "Search…"}
			searchable
			radius={0}
			nothingFoundMessage="No masks in this session"
			data={(data ?? []).map(({ id, name }) => ({ value: id, label: name }))}
			value={value || null}
			onChange={(value) => onChange(value ?? "")}
			{...props}
		/>
	);
};

/** A mask's name, for showing a mask that is referred to by id. */
export const MaskName = ({ id }: { id: string }) => {
	const { data } = useMasks();
	return <>{data?.find((mask) => mask.id === id)?.name ?? "mask"}</>;
};
