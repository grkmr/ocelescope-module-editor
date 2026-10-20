import { ActionIcon, Menu } from "@mantine/core";
import { Settings } from "lucide-react";

export const ModeMenu = <T extends string>({
	label,
	value,
	onChange,
	options,
}: {
	label: string;
	value: T;
	onChange: (value: T) => void;
	options: { value: T; label: string }[];
}) => (
	<Menu shadow="md">
		<Menu.Target>
			<ActionIcon variant="subtle" size={36} aria-label={label}>
				<Settings size={18} />
			</ActionIcon>
		</Menu.Target>
		<Menu.Dropdown>
			<Menu.Label>{label}</Menu.Label>
			<Menu.RadioGroup value={value} onChange={(value) => onChange(value as T)}>
				{options.map((option) => (
					<Menu.RadioItem key={option.value} value={option.value}>
						{option.label}
					</Menu.RadioItem>
				))}
			</Menu.RadioGroup>
		</Menu.Dropdown>
	</Menu>
);
