import {
	Collapse,
	Group,
	InlineStyles,
	Stack,
	type StackProps,
	Text,
	UnstyledButton,
} from "@mantine/core";
import { ActivityPicker, ObjectTypePicker } from "@ocelescope/core";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
import type { MaskSelection, TypeSelection } from "../api/ocelEditor";
import { type ViewParams, viewProps } from "../hooks/useView";
import { MaskSelect } from "./MaskSelect";
import { ModeMenu } from "./ModeMenu";

export type Selection = TypeSelection | MaskSelection;

export const selections: {
	[K in Selection["kind"]]: Extract<Selection, { kind: K }>;
} = {
	types: { kind: "types", names: [] },
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

export const SelectionInput = ({
	ocelId,
	entityType,
	view,
	value,
	onChange,
	...props
}: Omit<StackProps, "onChange"> & {
	ocelId: string;
	entityType: "object" | "event";
	view: ViewParams;
	value: Selection;
	onChange: (value: Selection) => void;
}) => {
	const Picker = entityType === "object" ? ObjectTypePicker : ActivityPicker;
	const [expanded, setExpanded] = useState(true);
	const label =
		value.kind === "mask"
			? `${entityType === "object" ? "Objects" : "Events"} of mask`
			: entityType === "object"
				? "Object types"
				: "Activities";

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
						{...viewProps(view)}
						value={value.names}
						onChange={(names) => onChange({ ...value, names })}
					/>
				</Collapse>
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
