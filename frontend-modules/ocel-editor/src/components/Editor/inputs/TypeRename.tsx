import {
	Box,
	Checkbox,
	Group,
	SegmentedControl,
	Stack,
	TextInput,
} from "@mantine/core";
import { ArrowRight } from "lucide-react";
import type {
	ActionDefinition,
	EditActionOf,
	EditInputProps,
} from "../../../types/edit";
import { AttributeSelect } from "../../AttributeSelect";
import { MaskName } from "../../MaskSelect";
import { SelectionInput, selections } from "../../SelectionInput";

type RenameType = "rename-object-type" | "rename-activity";
type RenameAction = EditActionOf<RenameType>;
type NewName = RenameAction["newName"];

const entityTypes = {
	"rename-object-type": "object",
	"rename-activity": "event",
} as const satisfies { [T in RenameType]: "object" | "event" };

const newNames: { [K in NewName["kind"]]: Extract<NewName, { kind: K }> } = {
	static: { kind: "static", name: "" },
	attribute: { kind: "attribute", attribute: "", dropMissing: false },
};

const TypeRenameInput = ({
	value,
	onChange,
	errors,
	steps,
}: EditInputProps<RenameType>) => {
	const { selection, newName } = value;
	const entityType = entityTypes[value.type];
	const entities = entityType === "object" ? "objects" : "events";

	return (
		<Stack gap="xs">
			<Group justify="flex-end">
				<SegmentedControl
					value={newName.kind}
					onChange={(kind) =>
						onChange({
							...value,
							newName: newNames[kind as NewName["kind"]],
						})
					}
					data={[
						{ label: "Fixed name", value: "static" },
						{ label: "From attribute", value: "attribute" },
					]}
				/>
			</Group>
			<Group align="flex-end" gap="sm" wrap="nowrap">
				<SelectionInput
					entityType={entityType}
					steps={steps}
					style={{ flex: 1 }}
					value={selection}
					error={errors?.selection}
					onChange={(selection) =>
						onChange({ ...value, selection } as RenameAction)
					}
				/>
				{/* Centred on the inputs rather than on their labels */}
				<Box h={36} style={{ display: "flex", alignItems: "center" }}>
					<ArrowRight size={18} />
				</Box>
				{newName.kind === "static" ? (
					<TextInput
						label="New name"
						style={{ flex: 1 }}
						value={newName.name}
						error={errors?.newName}
						onChange={(e) =>
							onChange({
								...value,
								newName: { ...newName, name: e.currentTarget.value },
							})
						}
					/>
				) : (
					<AttributeSelect
						entityType={entityType}
						types={selection.kind === "mask" ? [] : selection.names}
						steps={steps}
						style={{ flex: 1 }}
						value={newName.attribute}
						error={errors?.newName}
						onChange={(attribute) =>
							onChange({ ...value, newName: { ...newName, attribute } })
						}
					/>
				)}
			</Group>
			{newName.kind === "attribute" && (
				<Checkbox
					label={`Drop ${entities} without a value`}
					description={
						newName.dropMissing
							? "Their relations are dropped with them"
							: `Otherwise those ${entities} keep their type`
					}
					checked={newName.dropMissing ?? false}
					onChange={(e) =>
						onChange({
							...value,
							newName: { ...newName, dropMissing: e.currentTarget.checked },
						})
					}
				/>
			)}
		</Stack>
	);
};

const typeRename = <T extends RenameType>({
	type,
	label,
	name,
	types,
}: {
	type: T;
	label: string;
	name: (plural: boolean) => string;
	/** What the selected types are called, e.g. in "Pick at least one …". */
	types: { one: string; many: string };
}): ActionDefinition<T> => {
	const definition: ActionDefinition<RenameType> = {
		label,
		create: () =>
			({
				type,
				selection: selections[entityTypes[type]].types,
				newName: newNames.static,
			}) as RenameAction,
		name: ({ selection }) =>
			name(selection.kind === "mask" || selection.names.length > 1),
		title: ({ selection, newName }) => {
			const from =
				selection.kind === "mask" ? (
					selection.maskId ? (
						<MaskName id={selection.maskId} />
					) : (
						"mask"
					)
				) : (
					selection.names.join(", ") || types.many
				);
			const to =
				newName.kind === "static"
					? newName.name || "new name"
					: `value of ${newName.attribute || "attribute"}`;
			return (
				<>
					{from} → {to}
				</>
			);
		},
		validate: ({ selection, newName }) => ({
			...(selection.kind === "mask"
				? !selection.maskId && { selection: "Pick a mask" }
				: selection.names.length === 0 && {
						selection: `Pick at least one ${types.one}`,
					}),
			...(newName.kind === "static"
				? !newName.name.trim()
					? { newName: "Enter a new name" }
					: selection.kind !== "mask" &&
						selection.names.length === 1 &&
						selection.names[0] === newName.name && {
							newName: "Must differ from the current name",
						}
				: !newName.attribute && { newName: "Pick an attribute" }),
		}),
		Input: TypeRenameInput,
	};
	return definition as unknown as ActionDefinition<T>;
};

export const objectTypeRename = typeRename({
	type: "rename-object-type",
	label: "Rename object type",
	name: (plural) => `Rename Object Type${plural ? "s" : ""}`,
	types: { one: "object type", many: "object types" },
});

export const activityRename = typeRename({
	type: "rename-activity",
	label: "Rename activity",
	name: (plural) => `Rename Activit${plural ? "ies" : "y"}`,
	types: { one: "activity", many: "activities" },
});
