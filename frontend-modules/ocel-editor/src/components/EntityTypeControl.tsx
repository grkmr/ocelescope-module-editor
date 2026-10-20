import { SegmentedControl } from "@mantine/core";

type EntityType = "object" | "event";

export const EntityTypeControl = ({
	value,
	onChange,
}: {
	value: EntityType;
	onChange: (value: EntityType) => void;
}) => (
	<SegmentedControl
		value={value}
		onChange={(value) => onChange(value as EntityType)}
		data={[
			{ label: "Object", value: "object" },
			{ label: "Event", value: "event" },
		]}
	/>
);
