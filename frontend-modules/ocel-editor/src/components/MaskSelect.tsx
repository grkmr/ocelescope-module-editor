import type { SelectProps } from "@mantine/core";
import { useResources } from "@ocelescope/api-base";
import { ResourceSelect } from "@ocelescope/resources";

const MASK_TYPE =
	"55de364ec6b09b1c17c43044d63e61ef05fdac44afcd69c82b188070eb75e958";

export const MaskSelect = ({
	value,
	onChange,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	value: string;
	onChange: (value: string) => void;
}) => (
	<ResourceSelect
		label="Mask"
		placeholder="Search…"
		searchable
		radius={0}
		nothingFoundMessage="No masks in this session"
		{...props}
		type={MASK_TYPE}
		defaultValue={value || null}
		onChange={(value) => onChange(value ?? "")}
	/>
);

export const MaskName = ({ id }: { id: string }) => {
	const { data } = useResources({ schema_hash: MASK_TYPE });
	return <>{data?.find((mask) => mask.id === id)?.name ?? "mask"}</>;
};
