import { Group, type GroupProps } from "@mantine/core";
import type { MaskSelection, TypeSelection } from "../api/ocelEditor";
import type { EditAction } from "../types/edit";
import { MaskSelect } from "./MaskSelect";
import { ModeMenu } from "./ModeMenu";
import { TypeSelect } from "./TypeSelect";

export type Selection = TypeSelection | MaskSelection;

export const selections: {
	[K in Selection["kind"]]: Extract<Selection, { kind: K }>;
} = {
	types: { kind: "types", names: [] },
	mask: { kind: "mask", maskId: "" },
};

export const SelectionInput = ({
	entityType,
	steps,
	value,
	onChange,
	error,
	...props
}: Omit<GroupProps, "onChange"> & {
	entityType: "object" | "event";
	steps?: EditAction[];
	value: Selection;
	onChange: (value: Selection) => void;
	error?: string;
}) => (
	<Group gap={4} align="flex-end" wrap="nowrap" {...props}>
		{value.kind === "types" ? (
			<TypeSelect
				flex={1}
				miw={0}
				entityType={entityType}
				steps={steps}
				value={value.names}
				error={error}
				onChange={(names) => onChange({ ...value, names })}
			/>
		) : (
			<MaskSelect
				flex={1}
				miw={0}
				label={entityType === "object" ? "Objects of mask" : "Events of mask"}
				value={value.maskId}
				error={error}
				onChange={(maskId) => onChange({ ...value, maskId })}
			/>
		)}
		<ModeMenu
			label="Select by"
			value={value.kind}
			onChange={(kind) => onChange(selections[kind])}
			options={[
				{
					value: "types",
					label: entityType === "object" ? "Object type" : "Activity",
				},
				{ value: "mask", label: "OCEL mask" },
			]}
		/>
	</Group>
);
