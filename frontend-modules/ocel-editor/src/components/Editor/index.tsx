import {
	Box,
	Center,
	Divider,
	Group,
	Stack,
	Text,
	Title,
	Tooltip,
} from "@mantine/core";
import { InfoIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import type { EditActionType, Pipeline } from "../../types/edit";
import { ACTION_KINDS, completeSteps, kindOf } from "../Actions";
import { PipelineList } from "../Pipeline/PipelineList";
import { SaveAsOcel } from "./SaveAsOcel";

type EditorFormProps = { ocelId: string };

const PIPELINE_NOTE =
	"The steps run from top to bottom on the original log, each on the log as the steps before it leave it. Saving adds the result to the session as a new OCEL; incomplete steps are skipped.";

export const EditorForm = ({ ocelId }: EditorFormProps) => {
	const { control } = useForm<Pipeline>({ defaultValues: { steps: [] } });

	const { fields, append, remove, move } = useFieldArray({
		control,
		name: "steps",
	});
	const steps = useWatch({ control, name: "steps" });

	const [selectedId, setSelectedId] = useState<string | undefined>(
		fields[0]?.id,
	);
	const ids = fields.map(({ id }) => id);
	const selectedIndex = fields.findIndex(({ id }) => id === selectedId);
	const selectedStep = steps[selectedIndex];
	const before = completeSteps(steps.slice(0, Math.max(selectedIndex, 0)));

	const selectAdded = useRef(false);
	useEffect(() => {
		if (selectAdded.current) {
			selectAdded.current = false;
			setSelectedId(fields[fields.length - 1]?.id);
		}
	}, [fields]);

	const addStep = (type: EditActionType) => {
		selectAdded.current = true;
		append(ACTION_KINDS[type].create());
	};

	return (
		<Group h="100%" gap={0} wrap="nowrap" align="stretch">
			<Box
				flex={1}
				miw={0}
				p="md"
				style={{ overflow: "auto", display: "flex", flexDirection: "column" }}
			>
				{selectedStep ? (
					<Stack gap="md" flex={1} mih={0}>
						<Stack gap={4}>
							<Title order={4}>
								{selectedIndex + 1}. {kindOf(selectedStep).title}
							</Title>
							<Text size="sm" c="dimmed">
								{kindOf(selectedStep).description}
							</Text>
						</Stack>
						<Controller
							key={selectedId}
							control={control}
							name={`steps.${selectedIndex}`}
							render={({ field }) => {
								const { Panel } = kindOf(field.value);
								return (
									<Panel
										ocelId={ocelId}
										action={field.value}
										before={before}
										onChange={(step) =>
											field.onChange({ target: { value: step } })
										}
									/>
								);
							}}
						/>
					</Stack>
				) : (
					<Center flex={1}>
						<Text c="dimmed" size="sm" maw={360} ta="center">
							{fields.length === 0
								? "Add an edit to the pipeline on the right to start editing."
								: "Select a step on the right to edit it."}
						</Text>
					</Center>
				)}
			</Box>

			<Stack
				w={320}
				gap="sm"
				py="md"
				style={{ borderLeft: "1px solid var(--mantine-color-default-border)" }}
			>
				<Group justify="space-between" wrap="nowrap" h={28} px="md">
					<Group gap={6} wrap="nowrap">
						<Title order={5} lh={1}>
							Pipeline
						</Title>
						<Tooltip label={PIPELINE_NOTE} multiline w={280} withArrow>
							<InfoIcon
								size={16}
								color="var(--mantine-color-dimmed)"
								aria-label="How the pipeline runs"
							/>
						</Tooltip>
					</Group>
					<Group justify="flex-end" gap={4} wrap="nowrap" ml="auto">
						<SaveAsOcel ocelId={ocelId} pipeline={completeSteps(steps)} />
					</Group>
				</Group>
				<Divider />
				<PipelineList
					flex={1}
					mih={0}
					px="md"
					ids={ids}
					steps={steps}
					selectedId={selectedId}
					onSelect={setSelectedId}
					onRemove={remove}
					onMove={move}
					onAdd={addStep}
				/>
			</Stack>
		</Group>
	);
};
