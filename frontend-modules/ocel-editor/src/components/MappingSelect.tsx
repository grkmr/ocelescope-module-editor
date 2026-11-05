import {
	ActionIcon,
	Combobox,
	FileButton,
	Group,
	Select,
	type SelectProps,
	Tooltip,
} from "@mantine/core";
import { DefaultResource, useResources } from "@ocelescope/api-base";
import { useInvalidate } from "@ocelescope/core";
import { Upload } from "lucide-react";
import { useUploadMapping } from "../api/ocelEditor";
import { apiError } from "../lib/apiError";

const CSV_HELP =
	"Upload a CSV of one of the mapping's tables as a new OCEL mapping: ocel:oid for objects, ocel:eid for events, both for E2O relations, or ocel:oid_1 and ocel:oid_2 for O2O relations (ocel:qualifier optional, further columns are kept).";

export const MappingSelect = ({
	value,
	onChange,
	error,
	...props
}: Omit<SelectProps, "data" | "value" | "onChange"> & {
	value: string;
	onChange: (value: string) => void;
}) => {
	const { data: mappings = [] } = useResources({
		schema_hash: DefaultResource.OCELMapping,
	});
	const invalidate = useInvalidate();
	const upload = useUploadMapping({
		mutation: {
			onSuccess: async (id) => {
				await invalidate(["resources"]);
				onChange(id);
			},
		},
	});

	return (
		<Select
			label="OCEL mapping"
			placeholder="Search…"
			searchable
			radius={0}
			nothingFoundMessage="No OCEL mappings in this session"
			{...props}
			data={mappings.map(({ id, name }) => ({ value: id, label: name }))}
			value={value || null}
			onChange={(value) => onChange(value ?? "")}
			error={
				upload.isError
					? apiError(upload.error, "Uploading the CSV failed")
					: error
			}
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
									aria-label="Upload a CSV as an OCEL mapping"
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

export const MappingName = ({ id }: { id: string }) => {
	const { data } = useResources({ schema_hash: DefaultResource.OCELMapping });
	return <>{data?.find((mapping) => mapping.id === id)?.name ?? "mapping"}</>;
};
