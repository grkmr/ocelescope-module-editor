import { Box, Group, Stack, TextInput } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import type { ActionDefinition, EditInputProps } from "../../../types/edit";
import { EntityTypeControl } from "../../EntityTypeControl";
import { TypeSelect } from "../../TypeSelect";

const TypeRenameInput = ({
	value,
	onChange,
	errors,
}: EditInputProps<"rename-type">) => {
	return (
		<Stack gap="xs">
			<EntityTypeControl
				value={value.entityType}
				onChange={(entityType) =>
					onChange({ ...value, entityType, entityName: "" })
				}
			/>
			<Group align="flex-end" gap="sm" wrap="nowrap">
				<TypeSelect
					entityType={value.entityType}
					style={{ flex: 1 }}
					value={value.entityName}
					error={errors?.entityName}
					onChange={(entityName) => onChange({ ...value, entityName })}
				/>
				<Box h={36} style={{ display: "flex", alignItems: "center" }}>
					<ArrowRight size={18} />
				</Box>
				<TextInput
					label="New name"
					style={{ flex: 1 }}
					value={value.newEntityName}
					error={errors?.newEntityName}
					onChange={(e) =>
						onChange({ ...value, newEntityName: e.currentTarget.value })
					}
				/>
			</Group>
		</Stack>
	);
};

export const typeRename: ActionDefinition<"rename-type"> = {
	label: "Rename type",
	create: () => ({
		type: "rename-type",
		entityType: "object",
		entityName: "",
		newEntityName: "",
	}),
	name: ({ entityType }) =>
		entityType === "object" ? "Rename Object Type" : "Rename Activity",
	title: ({ entityType, entityName, newEntityName }) =>
		`${entityName || `${entityType} type`} → ${newEntityName || "new name"}`,
	validate: ({ entityType, entityName, newEntityName }) => ({
		...(!entityName && {
			entityName: `Pick ${entityType === "object" ? "an object type" : "an activity"}`,
		}),
		...(!newEntityName.trim()
			? { newEntityName: "Enter a new name" }
			: newEntityName === entityName && {
					newEntityName: "Must differ from the current name",
				}),
	}),
	Input: TypeRenameInput,
};
