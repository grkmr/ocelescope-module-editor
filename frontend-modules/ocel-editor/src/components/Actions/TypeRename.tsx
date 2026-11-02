import { Divider, Group, Radio, Stack, TextInput } from "@mantine/core";
import type { AttributeTypeNameMissing } from "../../api/ocelEditor";
import { useView } from "../../hooks/useView";
import type {
	ActionErrors,
	ActionKind,
	ActionPanel,
	EditActionOf,
} from "../../types/edit";
import { AttributeSelect } from "../AttributeSelect";
import { ModeMenu } from "../ModeMenu";
import { Previewed } from "../Previewed";
import {
	SelectionInput,
	SelectionName,
	selectionProblem,
	selections,
} from "../SelectionInput";

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

const TypeRenamePanel: ActionPanel<RenameType> = ({
	ocelId,
	action,
	onChange,
	before,
}) => {
	const view = useView(ocelId, before);
	const { selection, newName } = action;
	const entityType = entityTypes[action.type];
	const entities = entityType === "object" ? "Objects" : "Events";

	return (
		<Previewed query={{ data: view, isPending: true, error: null }}>
			{(view) => (
				<Stack gap="md">
					<SelectionInput
						ocelId={ocelId}
						entityType={entityType}
						view={view}
						value={selection}
						onChange={(selection) => onChange({ ...action, selection })}
					/>
					<Divider />
					<Stack gap="xs">
						<Group gap={4} align="flex-end" wrap="nowrap">
							{newName.kind === "static" ? (
								<TextInput
									flex={1}
									miw={0}
									radius={0}
									label="New name"
									value={newName.name}
									onChange={(e) =>
										onChange({
											...action,
											newName: { ...newName, name: e.currentTarget.value },
										})
									}
								/>
							) : (
								<AttributeSelect
									flex={1}
									miw={0}
									ocelId={ocelId}
									entityType={entityType}
									types={selection.kind === "types" ? selection.names : []}
									view={view}
									value={newName.attribute}
									onChange={(attribute) =>
										onChange({ ...action, newName: { ...newName, attribute } })
									}
								/>
							)}
							<ModeMenu
								label="Name by"
								value={newName.kind}
								onChange={(kind) =>
									onChange({ ...action, newName: newNames[kind] })
								}
								options={[
									{ value: "static", label: "Fixed name" },
									{ value: "attribute", label: "Attribute value" },
								]}
							/>
						</Group>
						{newName.kind === "attribute" && (
							<Radio.Group
								label={`${entities} without an attribute value`}
								value={newName.missing ?? "keep"}
								onChange={(missing) =>
									onChange({
										...action,
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
												onChange={(e) =>
													onChange({
														...action,
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
				</Stack>
			)}
		</Previewed>
	);
};

const typeRename = <T extends RenameType>({
	type,
	title,
	description,
	types,
}: {
	type: T;
	title: string;
	description: string;
	types: { one: string; many: string };
}): ActionKind<T> => {
	const kind: ActionKind<RenameType> = {
		title,
		description,
		Panel: TypeRenamePanel,
		create: () =>
			({
				type,
				selection: selections.types,
				newName: newNames.static,
			}) as RenameAction,
		summary: ({ selection, newName }) => {
			const to =
				newName.kind === "static"
					? newName.name || "new name"
					: `value of ${newName.attribute || "attribute"}`;
			return (
				<>
					<SelectionName selection={selection} types={types.many} /> → {to}
				</>
			);
		},
		validate: ({ selection, newName }): ActionErrors<RenameType> => ({
			...(selectionProblem(selection, types.one) && {
				selection: selectionProblem(selection, types.one),
			}),
			...(newName.kind === "static"
				? !newName.name.trim()
					? { newName: "Enter a new name" }
					: selection.kind === "types" &&
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
	};
	return kind as unknown as ActionKind<T>;
};

export const ObjectTypeRename = typeRename({
	type: "rename-object-type",
	title: "Rename Object Type",
	description:
		"Gives the selected objects a new type: one fixed name, so several types merge into one, or the value of an attribute, splitting a type by it.",
	types: { one: "object type", many: "object types" },
});

export const ActivityRename = typeRename({
	type: "rename-activity",
	title: "Rename Activity",
	description:
		"Gives the selected events a new activity: one fixed name, so several activities merge into one, or the value of an attribute, splitting an activity by it.",
	types: { one: "activity", many: "activities" },
});
