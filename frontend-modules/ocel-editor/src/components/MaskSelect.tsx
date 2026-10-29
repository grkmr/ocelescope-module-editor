import {
	ActionIcon,
	Combobox,
	FileButton,
	Group,
	Select,
	type SelectProps,
	Tooltip,
} from "@mantine/core";
import { useResources } from "@ocelescope/api-base";
import { useInvalidate } from "@ocelescope/core";
import type { AxiosError } from "axios";
import { Upload } from "lucide-react";
import { useUploadMask } from "../api/ocelEditor";

const MASK_TYPE =
	"55de364ec6b09b1c17c43044d63e61ef05fdac44afcd69c82b188070eb75e958";

const CSV_HELP =
	"Upload a CSV of one of the mask's tables as a new mask: ocel:oid for objects, ocel:eid for events, both for E2O relations, or ocel:oid_1 and ocel:oid_2 for O2O relations (ocel:qualifier optional).";

const uploadError = (error: unknown) => {
	const detail = (error as AxiosError<{ detail?: unknown }>).response?.data
		?.detail;
	return typeof detail === "string" ? detail : "Uploading the CSV failed";
};

export const MaskSelect = ({
	value,
	onChange,
	error,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	value: string;
	onChange: (value: string) => void;
}) => {
	const { data: masks = [] } = useResources({ schema_hash: MASK_TYPE });
	const invalidate = useInvalidate();
	const upload = useUploadMask({
		mutation: {
			onSuccess: async (id) => {
				await invalidate(["resources"]);
				onChange(id);
			},
		},
	});

	return (
		<Select
			label="Mask"
			placeholder="Search…"
			searchable
			radius={0}
			nothingFoundMessage="No masks in this session"
			{...props}
			data={masks.map(({ id, name }) => ({ value: id, label: name }))}
			value={value || null}
			onChange={(value) => onChange(value ?? "")}
			error={upload.isError ? uploadError(upload.error) : error}
			rightSectionPointerEvents="all"
			rightSectionWidth={56}
			rightSection={
				<Group gap={2} wrap="nowrap">
					<Combobox.Chevron />
					<FileButton
						accept=".csv,text/csv"
						onChange={(file) => file && upload.mutate({ data: { file } })}
					>
						{(props) => (
							<Tooltip label={CSV_HELP} multiline w={280} withArrow>
								<ActionIcon
									{...props}
									variant="subtle"
									loading={upload.isPending}
									aria-label="Upload a CSV as a mask"
								>
									<Upload size={16} />
								</ActionIcon>
							</Tooltip>
						)}
					</FileButton>
				</Group>
			}
		/>
	);
};

export const MaskName = ({ id }: { id: string }) => {
	const { data } = useResources({ schema_hash: MASK_TYPE });
	return <>{data?.find((mask) => mask.id === id)?.name ?? "mask"}</>;
};
