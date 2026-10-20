import { Button, Group, Paper, TextInput } from "@mantine/core";
import { Plus } from "lucide-react";
import type { UseFormRegisterReturn } from "react-hook-form";

export const EditorHeader = ({
	nameInput,
	nameError,
	loading,
	disabled,
}: {
	nameInput: UseFormRegisterReturn<"name">;
	nameError?: string;
	loading: boolean;
	disabled?: boolean;
}) => (
	<Paper withBorder radius={0} p="md">
		<Group align="flex-start" wrap="nowrap">
			<TextInput
				placeholder="Name of the new OCEL"
				aria-label="Name of the new OCEL"
				size="md"
				style={{ flex: 1 }}
				error={nameError}
				{...nameInput}
			/>
			<Button
				type="submit"
				size="md"
				leftSection={<Plus size={18} />}
				loading={loading}
				disabled={disabled}
			>
				Create OCEL
			</Button>
		</Group>
	</Paper>
);
