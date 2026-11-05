import {
	Collapse,
	Group,
	InlineStyles,
	Stack,
	type StackProps,
	Text,
	UnstyledButton,
} from "@mantine/core";
import {
	ActivityPicker,
	EventPicker,
	ObjectPicker,
	ObjectTypePicker,
	viewProps,
} from "@ocelescope/core";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type {
	IdSelection,
	MaskSelection,
	TypeSelection,
} from "../api/ocelEditor";
import { MaskName, MaskSelect } from "./MaskSelect";
import { ModeMenu } from "./ModeMenu";

export type Selection = TypeSelection | IdSelection | MaskSelection;

export const selections: {
	[K in Selection["kind"]]: Extract<Selection, { kind: K }>;
} = {
	types: { kind: "types", names: [] },
	ids: { kind: "ids", ids: [] },
	mask: { kind: "mask", maskId: "" },
};

const PICKER_CLASS = "ocelescope-editor-type-picker";

const LIST_MAX_HEIGHT = 280;

const MaxHeightStyles = () => (
	<InlineStyles
		deduplicate
		selector={`.${PICKER_CLASS} [role="listbox"]`}
		styles={{ maxHeight: `${LIST_MAX_HEIGHT}px !important` }}
	/>
);

export const SelectionName = ({
	selection,
	types,
}: {
	selection: Selection;
	types: string;
}) => {
	if (selection.kind === "types") {
		return <>{selection.names.join(", ") || types}</>;
	}
	if (selection.kind === "ids") {
		return <>{`${selection.ids.length} ids`}</>;
	}
	return selection.maskId ? <MaskName id={selection.maskId} /> : <>mask</>;
};

export const selectionProblem = (selection: Selection, type: string) => {
	if (selection.kind === "mask") {
		return selection.maskId ? undefined : "Pick a mask";
	}
	if (selection.kind === "ids") {
		return selection.ids.length > 0 ? undefined : "Pick at least one id";
	}
	return selection.names.length > 0 ? undefined : `Pick at least one ${type}`;
};

export const SelectionInput = ({
	ocelId,
	entityType,
	title,
	viewId,
	value,
	onChange,
	...props
}: Omit<StackProps, "onChange"> & {
	ocelId: string;
	entityType: "object" | "event";
	title?: string;
	viewId: string | null;
	value: Selection;
	onChange: (value: Selection) => void;
}) => {
	const Picker = entityType === "object" ? ObjectTypePicker : ActivityPicker;
	const IdPicker = entityType === "object" ? ObjectPicker : EventPicker;
	const [expanded, setExpanded] = useState(true);
	const entities = entityType === "object" ? "Objects" : "Events";
	const label =
		title ??
		(value.kind === "mask"
			? `${entities} of mask`
			: value.kind === "ids"
				? entities
				: entityType === "object"
					? "Object types"
					: "Activities");

	return (
		<Stack gap={4} className={PICKER_CLASS} {...props}>
			<MaxHeightStyles />
			<Group justify="space-between" wrap="nowrap">
				{value.kind === "types" ? (
					<UnstyledButton
						flex={1}
						miw={0}
						onClick={() => setExpanded((expanded) => !expanded)}
						aria-expanded={expanded}
					>
						<Group gap={6} wrap="nowrap">
							<ChevronRight
								size={16}
								style={{
									flex: "none",
									transform: expanded ? "rotate(90deg)" : undefined,
									transition: "transform 150ms ease",
								}}
							/>
							<Text size="sm" fw={500} style={{ flex: "none" }}>
								{label}
							</Text>
							{!expanded && (
								<Text size="sm" c="dimmed" truncate miw={0}>
									{value.names.join(", ") || "None picked"}
								</Text>
							)}
						</Group>
					</UnstyledButton>
				) : (
					<Text size="sm" fw={500}>
						{label}
					</Text>
				)}
				<ModeMenu
					label="Select by"
					value={value.kind}
					onChange={(kind) => onChange(selections[kind])}
					options={[
						{
							value: "types",
							label: entityType === "object" ? "Object type" : "Activity",
						},
						{
							value: "ids",
							label: entityType === "object" ? "Object ids" : "Event ids",
						},
						{ value: "mask", label: "OCEL mask" },
					]}
				/>
			</Group>
			{value.kind === "types" ? (
				<Collapse expanded={expanded}>
					<Picker
						variant="list"
						multiple
						cutoff
						ocelId={ocelId}
						{...viewProps(viewId)}
						value={value.names}
						onChange={(names) => onChange({ ...value, names })}
					/>
				</Collapse>
			) : value.kind === "ids" ? (
				<IdPicker
					multiple
					ocelId={ocelId}
					ocelVersion="original"
					value={value.ids}
					onChange={(ids) => onChange({ ...value, ids })}
				/>
			) : (
				<MaskSelect
					label={undefined}
					value={value.maskId}
					onChange={(maskId) => onChange({ ...value, maskId })}
				/>
			)}
		</Stack>
	);
};
