import { Box, Group, Stack, TextInput } from "@mantine/core";
import { ArrowRight } from "lucide-react";
import type { ActionDefinition, EditInputProps } from "../../../types/edit";
import { AttributeSelect } from "../../AttributeSelect";
import { EntityTypeControl } from "../../EntityTypeControl";

const AttributeRenameInput = ({
	value,
	onChange,
	errors,
}: EditInputProps<"rename-attribute">) => {
	const entityType = value.entityType ?? "event";

	return (
		<Stack gap="xs">
			<EntityTypeControl
				value={entityType}
				onChange={(entityType) =>
					onChange({ ...value, entityType, currentAttributeName: "" })
				}
			/>
			<Group align="flex-end" gap="sm" wrap="nowrap">
				<AttributeSelect
					entityType={entityType}
					style={{ flex: 1 }}
					value={value.currentAttributeName}
					error={errors?.currentAttributeName}
					onChange={(currentAttributeName) =>
						onChange({ ...value, currentAttributeName })
					}
				/>
				<Box h={36} style={{ display: "flex", alignItems: "center" }}>
					<ArrowRight size={18} />
				</Box>
				<TextInput
					label="New name"
					style={{ flex: 1 }}
					value={value.newAttributeName}
					error={errors?.newAttributeName}
					onChange={(e) =>
						onChange({ ...value, newAttributeName: e.currentTarget.value })
					}
				/>
			</Group>
		</Stack>
	);
};

export const attributeRename: ActionDefinition<"rename-attribute"> = {
	label: "Rename attribute",
	create: () => ({
		type: "rename-attribute",
		entityType: "event",
		currentAttributeName: "",
		newAttributeName: "",
	}),
	name: ({ entityType }) =>
		entityType === "object"
			? "Rename Object Attribute"
			: "Rename Event Attribute",
	title: ({ currentAttributeName, newAttributeName }) =>
		`${currentAttributeName || "attribute"} → ${newAttributeName || "new name"}`,
	validate: ({ currentAttributeName, newAttributeName }) => ({
		...(!currentAttributeName && {
			currentAttributeName: "Pick an attribute",
		}),
		...(!newAttributeName.trim()
			? { newAttributeName: "Enter a new name" }
			: newAttributeName === currentAttributeName && {
					newAttributeName: "Must differ from the current name",
				}),
	}),
	Input: AttributeRenameInput,
};
