import {
	ActionIcon,
	Collapse,
	Group,
	Paper,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { ArrowDown, ArrowUp, ChevronRight, Trash2 } from "lucide-react";
import { type ComponentType, type ReactNode, useEffect, useState } from "react";
import type {
	ActionDefinition,
	ActionErrors,
	EditAction,
	EditActionType,
	EditInputProps,
} from "../../../types/edit";
import { activityRename, objectTypeRename } from "./TypeRename";

export const actions: { [T in EditActionType]: ActionDefinition<T> } = {
	"rename-object-type": objectTypeRename,
	"rename-activity": activityRename,
};

export const actionTypes = Object.keys(actions) as EditActionType[];

const definitionOf = (action: EditAction) =>
	actions[action.type] as unknown as {
		name: (action: EditAction) => string;
		title: (action: EditAction) => ReactNode;
		validate: (action: EditAction) => ActionErrors<EditActionType>;
		Input: ComponentType<EditInputProps<EditActionType>>;
	};

export const validateAction = (action: EditAction) =>
	Object.keys(definitionOf(action).validate(action)).length === 0 ||
	"This step is incomplete";

export const EditorInput = ({
	value,
	onChange,
	steps,
	onMoveUp,
	onMoveDown,
	onRemove,
	invalid = false,
}: Omit<EditInputProps<EditActionType>, "errors"> & {
	onMoveUp?: () => void;
	onMoveDown?: () => void;
	onRemove: () => void;
	invalid?: boolean;
}) => {
	const [expanded, setExpanded] = useState(true);
	const { name, title, validate, Input } = definitionOf(value);

	useEffect(() => {
		if (invalid) setExpanded(true);
	}, [invalid]);

	return (
		<Paper
			withBorder
			radius={0}
			style={
				invalid ? { borderColor: "var(--mantine-color-error)" } : undefined
			}
		>
			<Group gap="xs" wrap="nowrap" pr="md">
				<UnstyledButton
					p="md"
					flex={1}
					miw={0}
					onClick={() => setExpanded((expanded) => !expanded)}
					aria-expanded={expanded}
				>
					<Group gap="xs" wrap="nowrap">
						<ChevronRight
							size={18}
							style={{
								flex: "none",
								transform: expanded ? "rotate(90deg)" : undefined,
								transition: "transform 150ms ease",
							}}
						/>
						<Text fw={500} truncate miw={0}>
							{title(value)}
						</Text>
						<Text c="dimmed" size="sm" style={{ flex: "none" }}>
							{name(value)}
						</Text>
					</Group>
				</UnstyledButton>
				<Group gap={4} wrap="nowrap">
					<ActionIcon
						variant="subtle"
						disabled={!onMoveUp}
						onClick={onMoveUp}
						aria-label="Move up"
					>
						<ArrowUp size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						disabled={!onMoveDown}
						onClick={onMoveDown}
						aria-label="Move down"
					>
						<ArrowDown size={16} />
					</ActionIcon>
					<ActionIcon
						variant="subtle"
						color="red"
						onClick={onRemove}
						aria-label="Remove step"
					>
						<Trash2 size={16} />
					</ActionIcon>
				</Group>
			</Group>
			<Collapse expanded={expanded}>
				<Paper radius={0} px="md" pb="md">
					<Input
						value={value}
						onChange={onChange}
						steps={steps}
						errors={invalid ? validate(value) : undefined}
					/>
				</Paper>
			</Collapse>
		</Paper>
	);
};
