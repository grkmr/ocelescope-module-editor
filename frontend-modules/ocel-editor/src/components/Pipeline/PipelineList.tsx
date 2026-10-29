import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors,
} from "@dnd-kit/core";
import {
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
	Button,
	Menu,
	ScrollArea,
	Stack,
	type StackProps,
	Text,
} from "@mantine/core";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import type { EditAction, EditActionType } from "../../types/edit";
import { ACTION_KINDS } from "../Actions";
import { PipelineStep } from "./PipelineStep";

const TYPES = Object.keys(ACTION_KINDS) as EditActionType[];

type OwnProps = {
	ids: string[];
	steps: EditAction[];
	selectedId?: string;
	onSelect: (id: string) => void;
	onRemove: (index: number) => void;
	onMove: (from: number, to: number) => void;
	onAdd: (type: EditActionType) => void;
};

type PipelineListProps = OwnProps & Omit<StackProps, keyof OwnProps>;

export const PipelineList = ({
	ids,
	steps,
	selectedId,
	onSelect,
	onRemove,
	onMove,
	onAdd,
	...stackProps
}: PipelineListProps) => {
	const [search, setSearch] = useState("");
	const shown = TYPES.filter((type) =>
		ACTION_KINDS[type].title
			.toLowerCase()
			.includes(search.trim().toLowerCase()),
	);

	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const onDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) {
			return;
		}
		onMove(ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
	};

	return (
		<Stack gap="xs" {...stackProps}>
			<ScrollArea flex={1} mih={0} type="auto" scrollbarSize={6}>
				<Stack gap="xs">
					{ids.length === 0 && (
						<Text size="sm" c="dimmed">
							No edits yet. Add one to start the pipeline.
						</Text>
					)}
					<DndContext
						sensors={sensors}
						collisionDetection={closestCenter}
						onDragEnd={onDragEnd}
					>
						<SortableContext items={ids} strategy={verticalListSortingStrategy}>
							{ids.map((id, index) => {
								const step = steps[index];
								return (
									step && (
										<PipelineStep
											key={id}
											id={id}
											index={index}
											step={step}
											selected={id === selectedId}
											onSelect={() => onSelect(id)}
											onRemove={() => onRemove(index)}
										/>
									)
								);
							})}
						</SortableContext>
					</DndContext>
				</Stack>
			</ScrollArea>
			<Menu position="bottom-start" width="target">
				<Menu.Target>
					<Button
						variant="light"
						leftSection={<PlusIcon size={16} />}
						fullWidth
					>
						Add edit
					</Button>
				</Menu.Target>
				<Menu.Dropdown>
					<Menu.Search
						value={search}
						onChange={(event) => setSearch(event.currentTarget.value)}
						placeholder="Search edits"
					/>
					{shown.map((type) => (
						<Menu.Item key={type} onClick={() => onAdd(type)}>
							{ACTION_KINDS[type].title}
						</Menu.Item>
					))}
					{shown.length === 0 && <Menu.Label>No edit matches</Menu.Label>}
				</Menu.Dropdown>
			</Menu>
		</Stack>
	);
};
