import { Box, Group, Radio, Stack, TextInput } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import type { AttributeTypeNameMissing } from "../../../api/ocelEditor";
import type {
	ActionDefinition,
	EditActionOf,
	EditInputProps,
} from "../../../types/edit";
import { AttributeSelect } from "../../AttributeSelect";
import { MaskName } from "../../MaskSelect";
import { ModeMenu } from "../../ModeMenu";
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
	attribute: { kind: "attribute", attribute: "", missing: "keep" },
};

const TypeRenameInput = ({
	value,
	onChange,
	errors,
	steps,
}: EditInputProps<RenameType>) => {
	const { selection, newName } = value;
	const entityType = entityTypes[value.type];
	const entities = entityType === "object" ? "Objects" : "Events";

	return (
		<Stack gap="xs">
			<Group align="flex-end" gap="sm" wrap="nowrap">
				<SelectionInput
					entityType={entityType}
					steps={steps}
					value={selection}
					error={errors?.selection}
					flex={1}
					miw={0}
					onChange={(selection) => onChange({ ...value, selection })}
				/>
				<Box h={36} style={{ display: "flex", alignItems: "center" }}>
					<ArrowRight size={18} />
				</Box>
				<Group flex={1} miw={0} gap={4} align="flex-end" wrap="nowrap">
					{newName.kind === "static" ? (
						<TextInput
							flex={1}
							miw={0}
							radius={0}
							label="New name"
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
							flex={1}
							miw={0}
							entityType={entityType}
							types={selection.kind === "mask" ? [] : selection.names}
							steps={steps}
							value={newName.attribute}
							error={!newName.attribute && errors?.newName}
							onChange={(attribute) =>
								onChange({ ...value, newName: { ...newName, attribute } })
							}
						/>
					)}
					<ModeMenu
						label="Name by"
						value={newName.kind}
						onChange={(kind) => onChange({ ...value, newName: newNames[kind] })}
						options={[
							{ value: "static", label: "Fixed name" },
							{ value: "attribute", label: "Attribute value" },
						]}
					/>
				</Group>
			</Group>
			{newName.kind === "attribute" && (
				<Radio.Group
					label={`${entities} without an attribute value`}
					value={newName.missing ?? "keep"}
					onChange={(missing) =>
						onChange({
							...value,
							newName: {
								...newName,
								missing: missing as AttributeTypeNameMissing,
							},
						})
					}
				>
					<Group mt="xs" gap="xl" align="flex-start" wrap="nowrap">
						<Radio
							value="keep"
							label="Keep type"
							description="They are not renamed"
						/>
						<Radio
							value="drop"
							label="Drop"
							description="Along with their relations"
						/>
						<Radio
							value="fallback"
							flex={1}
							miw={0}
							styles={{ labelWrapper: { flex: 1 } }}
							label={
								<TextInput
									size="xs"
									radius={0}
									placeholder="Fallback name"
									value={newName.fallbackName ?? ""}
									error={!!newName.attribute && !!errors?.newName}
									onChange={(e) =>
										onChange({
											...value,
											newName: {
												...newName,
												missing: "fallback",
												fallbackName: e.currentTarget.value,
											},
										})
									}
								/>
							}
						/>
					</Group>
				</Radio.Group>
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
				selection: selections.types,
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
				: !newName.attribute
					? { newName: "Pick an attribute" }
					: newName.missing === "fallback" &&
						!newName.fallbackName?.trim() && {
							newName: "Enter a fallback name",
						}),
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
