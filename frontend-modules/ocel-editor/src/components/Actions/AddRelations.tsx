import { Divider, SegmentedControl, Stack, TextInput } from "@mantine/core";
import { useView } from "../../hooks/useView";
import type {
	ActionErrors,
	ActionKind,
	ActionPanel,
	EditActionOf,
} from "../../types/edit";
import { MaskName, MaskSelect } from "../MaskSelect";
import { Previewed } from "../Previewed";
import {
	SelectionInput,
	SelectionName,
	selectionProblem,
	selections,
} from "../SelectionInput";

type AddType = "add-e2o" | "add-o2o";
type AddAction = EditActionOf<AddType>;
type Relations = AddAction["relations"];

const sourceTypes = {
	"add-e2o": "event",
	"add-o2o": "object",
} as const satisfies { [T in AddType]: "object" | "event" };

const relationsOf: {
	[K in Relations["kind"]]: Extract<Relations, { kind: K }>;
} = {
	pairs: {
		kind: "pairs",
		sources: selections.types,
		targets: selections.types,
	},
	mask: { kind: "mask", maskId: "" },
};

const AddRelationsPanel: ActionPanel<AddType> = ({
	ocelId,
	action,
	onChange,
	before,
}) => {
	const view = useView(ocelId, before);
	const { relations, qualifier } = action;
	const sourceType = sourceTypes[action.type];

	return (
		<Previewed query={view}>
			{(view) => (
				<Stack gap="md">
					<SegmentedControl
						radius={0}
						value={relations.kind}
						onChange={(kind) =>
							onChange({
								...action,
								relations: relationsOf[kind as Relations["kind"]],
							})
						}
						data={[
							{ value: "pairs", label: "Between entities" },
							{ value: "mask", label: "From a mask" },
						]}
					/>
					{relations.kind === "mask" ? (
						<MaskSelect
							value={relations.maskId}
							onChange={(maskId) =>
								onChange({ ...action, relations: { ...relations, maskId } })
							}
						/>
					) : (
						<>
							<SelectionInput
								ocelId={ocelId}
								entityType={sourceType}
								title={
									sourceType === "event" ? "Source events" : "Source objects"
								}
								view={view}
								value={relations.sources}
								onChange={(sources) =>
									onChange({ ...action, relations: { ...relations, sources } })
								}
							/>
							<Divider />
							<SelectionInput
								ocelId={ocelId}
								entityType="object"
								title="Target objects"
								view={view}
								value={relations.targets}
								onChange={(targets) =>
									onChange({ ...action, relations: { ...relations, targets } })
								}
							/>
						</>
					)}
					<TextInput
						radius={0}
						label="Qualifier"
						description={
							relations.kind === "mask"
								? "For the relations the mask lists without one"
								: undefined
						}
						value={qualifier}
						onChange={(e) =>
							onChange({ ...action, qualifier: e.currentTarget.value })
						}
					/>
				</Stack>
			)}
		</Previewed>
	);
};

const addRelations = <T extends AddType>({
	type,
	title,
	description,
	source,
}: {
	type: T;
	title: string;
	description: string;
	source: { one: string; many: string };
}): ActionKind<T> => {
	const kind: ActionKind<AddType> = {
		title,
		description,
		Panel: AddRelationsPanel,
		create: () =>
			({ type, relations: relationsOf.pairs, qualifier: "" }) as AddAction,
		summary: ({ relations, qualifier }) => (
			<>
				{relations.kind === "mask" ? (
					relations.maskId ? (
						<MaskName id={relations.maskId} />
					) : (
						"mask"
					)
				) : (
					<>
						<SelectionName selection={relations.sources} types={source.many} />
						{" → "}
						<SelectionName selection={relations.targets} types="object types" />
					</>
				)}
				{qualifier && ` (${qualifier})`}
			</>
		),
		validate: ({ relations, qualifier }): ActionErrors<AddType> => {
			const problem =
				relations.kind === "mask"
					? !relations.maskId && "Pick a mask"
					: (selectionProblem(relations.sources, source.one) ??
						selectionProblem(relations.targets, "object type"));
			return {
				...(problem && { relations: problem }),
				...(!qualifier.trim() && { qualifier: "Enter a qualifier" }),
			};
		},
	};
	return kind as unknown as ActionKind<T>;
};

export const AddE2O = addRelations({
	type: "add-e2o",
	title: "Add E2O Relations",
	description:
		"Relates events to objects: every source event to every target object, or the E2O relations a mask lists. Relations the log already has, and ids it does not have, are left out.",
	source: { one: "activity", many: "activities" },
});

export const AddO2O = addRelations({
	type: "add-o2o",
	title: "Add O2O Relations",
	description:
		"Relates objects to objects: every source object to every other target object, or the O2O relations a mask lists. Relations the log already has, and ids it does not have, are left out.",
	source: { one: "object type", many: "object types" },
});
