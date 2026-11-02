import {
	ActionIcon,
	Button,
	Popover,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from "@mantine/core";
import { SaveIcon } from "lucide-react";
import { useState } from "react";
import { useSaveAsOcel } from "../../api/ocelEditor";
import { apiError } from "../../lib/apiError";
import type { EditAction } from "../../types/edit";

/** Adds the log as `pipeline` leaves it to the session as an OCEL of its own. */
export const SaveAsOcel = ({
	ocelId,
	pipeline,
}: {
	ocelId: string;
	pipeline: EditAction[];
}) => {
	const [opened, setOpened] = useState(false);
	const [name, setName] = useState("");
	const { mutate, isPending, error } = useSaveAsOcel({
		mutation: {
			onSuccess: () => {
				setOpened(false);
				setName("");
			},
		},
	});
	const save = () =>
		name.trim() &&
		mutate({ ocelId, data: pipeline, params: { name: name.trim() } });

	return (
		<Popover
			opened={opened}
			onChange={setOpened}
			position="bottom-end"
			withArrow
		>
			<Popover.Target>
				<Tooltip label="Save as new OCEL" disabled={opened}>
					<ActionIcon
						variant="subtle"
						disabled={pipeline.length === 0}
						onClick={() => setOpened((opened) => !opened)}
					>
						<SaveIcon size={20} />
					</ActionIcon>
				</Tooltip>
			</Popover.Target>
			<Popover.Dropdown>
				<Stack gap="xs" w={260}>
					<TextInput
						label="Name of the new OCEL"
						data-autofocus
						value={name}
						onChange={(e) => setName(e.currentTarget.value)}
						onKeyDown={(e) => e.key === "Enter" && save()}
					/>
					{error && (
						<Text c="red" size="xs">
							{apiError(error, "Saving the OCEL failed.")}
						</Text>
					)}
					<Button
						size="xs"
						loading={isPending}
						disabled={!name.trim()}
						onClick={save}
					>
						Save
					</Button>
				</Stack>
			</Popover.Dropdown>
		</Popover>
	);
};
