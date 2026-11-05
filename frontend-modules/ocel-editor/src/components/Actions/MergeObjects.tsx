import {
	ActionIcon,
	Autocomplete,
	Button,
	Group,
	Paper,
	Radio,
	SegmentedControl,
	Stack,
	Text,
	TextInput,
} from "@mantine/core";
import { useObjectCounts } from "@ocelescope/api-base";
import { ObjectPicker, viewParams } from "@ocelescope/core";
import { PlusIcon, XIcon } from "lucide-react";
import type { ObjectMerge } from "../../api/ocelEditor";
import type { ActionKind, ActionPanel } from "../../types/edit";
import {
	SelectionInput,
	SelectionName,
	selectionProblem,
	selections,
} from "../SelectionInput";

const newMerge: ObjectMerge = {
	newId: "",
	objectType: "",
	objects: selections.ids,
};

const MergeInput = ({
	ocelId,
	viewId,
	types,
	merge,
	onChange,
	onRemove,
}: {
	ocelId: string;
	viewId: string | null;
	types: string[];
	merge: ObjectMerge;
	onChange: (merge: ObjectMerge) => void;
	onRemove?: () => void;
}) => (
	<Paper withBorder radius={0} p="sm">
		<Stack gap="sm">
			<Group gap="sm" align="flex-end" wrap="nowrap">
				<TextInput
					flex={1}
					miw={0}
					radius={0}
					label="New object id"
					value={merge.newId}
					onChange={(e) => onChange({ ...merge, newId: e.currentTarget.value })}
				/>
				<Autocomplete
					flex={1}
					miw={0}
					radius={0}
					label="Object type"
					placeholder="Existing or new"
					data={types}
					value={merge.objectType}
					onChange={(objectType) => onChange({ ...merge, objectType })}
				/>
				{onRemove && (
					<ActionIcon
						variant="subtle"
						color="red"
						size={36}
						aria-label="Remove merge"
						onClick={onRemove}
					>
						<XIcon size={16} />
					</ActionIcon>
				)}
			</Group>
			<SelectionInput
				ocelId={ocelId}
				entityType="object"
				title="Objects to merge"
				viewId={viewId}
				value={merge.objects}
				onChange={(objects) => onChange({ ...merge, objects })}
			/>
			<ObjectPicker
				label="Copy attributes from (optional)"
				description="The new object takes each attribute once, at the value picked below"
				ocelId={ocelId}
				ocelVersion="original"
				value={merge.copyFrom}
				onChange={(copyFrom) => onChange({ ...merge, copyFrom })}
			/>
			{merge.copyFrom && (
				<SegmentedControl
					radius={0}
					value={merge.copyAt ?? "start"}
					onChange={(copyAt) =>
						onChange({ ...merge, copyAt: copyAt as "start" | "end" })
					}
					data={[
						{ value: "start", label: "Values at initialization" },
						{ value: "end", label: "Values at the end" },
					]}
				/>
			)}
		</Stack>
	</Paper>
);

const MergeObjectsPanel: ActionPanel<"merge-objects"> = ({
	ocelId,
	step,
	onChange,
	viewId,
}) => {
	const { merges, qualifier, objectRelations } = step;
	const { data: counts } = useObjectCounts(ocelId, viewParams(viewId));
	const types = Object.keys(counts ?? {}).sort((a, b) => a.localeCompare(b));

	const setMerges = (merges: ObjectMerge[]) => onChange({ ...step, merges });

	return (
		<Stack gap="md">
			{merges.map((merge, index) => (
				<MergeInput
					key={index}
					ocelId={ocelId}
					viewId={viewId}
					types={types}
					merge={merge}
					onChange={(merge) =>
						setMerges(merges.map((m, i) => (i === index ? merge : m)))
					}
					onRemove={
						merges.length > 1
							? () => setMerges(merges.filter((_, i) => i !== index))
							: undefined
					}
				/>
			))}
			<Button
				variant="light"
				radius={0}
				leftSection={<PlusIcon size={16} />}
				onClick={() => setMerges([...merges, newMerge])}
			>
				Add merge
			</Button>
			<Radio.Group
				label="Qualifier of the new event relations"
				value={qualifier.kind}
				onChange={(kind) =>
					onChange({
						...step,
						qualifier:
							kind === "fixed" ? { kind: "fixed", name: "" } : { kind: "keep" },
					})
				}
			>
				<Group mt="xs" gap="xl" align="flex-start" wrap="nowrap">
					<Radio
						value="keep"
						label="Keep the originals"
						description="One relation per qualifier the merged objects had"
					/>
					<Radio
						value="fixed"
						flex={1}
						miw={0}
						styles={{ labelWrapper: { flex: 1 } }}
						label={
							<TextInput
								size="xs"
								radius={0}
								placeholder="One qualifier for all"
								value={qualifier.kind === "fixed" ? qualifier.name : ""}
								onChange={(e) =>
									onChange({
										...step,
										qualifier: {
											kind: "fixed",
											name: e.currentTarget.value,
										},
									})
								}
							/>
						}
					/>
				</Group>
			</Radio.Group>
			<Radio.Group
				label="O2O relations of the merged objects"
				value={objectRelations}
				onChange={(objectRelations) =>
					onChange({
						...step,
						objectRelations: objectRelations as typeof step.objectRelations,
					})
				}
			>
				<Group mt="xs" gap="xl" align="flex-start" wrap="nowrap">
					<Radio
						value="move"
						label="Move to the new object"
						description="Those between objects of one merge are dropped"
					/>
					<Radio
						value="drop"
						label="Drop"
						description="They go with the merged objects"
					/>
				</Group>
			</Radio.Group>
		</Stack>
	);
};

const mergeProblem = (merge: ObjectMerge) =>
	!merge.newId.trim()
		? "Enter a new object id"
		: !merge.objectType.trim()
			? "Enter an object type"
			: selectionProblem(merge.objects, "object type");

export const MergeObjects: ActionKind<"merge-objects"> = {
	title: "Merge Objects",
	description:
		"Replaces sets of objects by one new object each, related to every event any object of the set is. The merged objects are removed afterwards.",
	Panel: MergeObjectsPanel,
	create: () => ({
		type: "merge-objects",
		merges: [newMerge],
		qualifier: { kind: "keep" },
		objectRelations: "move",
	}),
	summary: ({ merges }) => {
		const [first] = merges;
		if (!first) {
			return null;
		}
		return (
			<>
				<SelectionName selection={first.objects} types="objects" />
				{` → ${first.newId || "new object"}`}
				{merges.length > 1 && (
					<Text span inherit>{` +${merges.length - 1} more`}</Text>
				)}
			</>
		);
	},
	validate: ({ merges, qualifier }) => {
		const ids = merges.map(({ newId }) => newId.trim());
		const problem =
			merges.map(mergeProblem).find(Boolean) ??
			(new Set(ids).size < ids.length
				? "Each merge needs a new id of its own"
				: undefined);
		return {
			...(problem && { merges: problem }),
			...(qualifier.kind === "fixed" &&
				!qualifier.name.trim() && { qualifier: "Enter a qualifier" }),
		};
	},
};
