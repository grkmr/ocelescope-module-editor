import { SegmentedControl, Stack, type StackProps } from "@mantine/core";
import type { MaskSelection, TypeSelection } from "../api/ocelEditor";
import type { EditAction } from "../types/edit";
import { MaskSelect } from "./MaskSelect";
import { TypeSelect } from "./TypeSelect";

export type Selection = TypeSelection | MaskSelection;

export const selections: {
	[K in Selection["kind"]]: Extract<Selection, { kind: K }>;
} = {
	types: { kind: "types", names: [] },
	mask: { kind: "mask", maskId: "" },
};

/** Which objects or events to work on: by their type, or as a mask lists them. */
export const SelectionInput = ({
	entityType,
	steps,
	value,
	onChange,
	error,
	...props
}: Omit<StackProps, "onChange"> & {
	entityType: "object" | "event";
	steps?: EditAction[];
	value: Selection;
	onChange: (value: Selection) => void;
	error?: string;
}) => (
	<Stack gap={4} {...props}>
		<SegmentedControl
			size="xs"
			value={value.kind}
			onChange={(kind) => onChange(selections[kind as Selection["kind"]])}
			data={[
				{ label: "By type", value: "types" },
				{ label: "By mask", value: "mask" },
			]}
		/>
		{value.kind === "types" ? (
			<TypeSelect
				entityType={entityType}
				steps={steps}
				value={value.names}
				error={error}
				onChange={(names) => onChange({ ...value, names })}
			/>
		) : (
			<MaskSelect
				label={entityType === "object" ? "Objects of mask" : "Events of mask"}
				value={value.maskId}
				error={error}
				onChange={(maskId) => onChange({ ...value, maskId })}
			/>
		)}
	</Stack>
);
