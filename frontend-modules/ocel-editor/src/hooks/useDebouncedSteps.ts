import { useDebouncedValue } from "@mantine/hooks";
import { useMemo } from "react";
import type { EditAction } from "../types/edit";

export const useDebouncedSteps = (steps: EditAction[] = []) => {
	const [debouncedJson] = useDebouncedValue(JSON.stringify(steps), 400);

	return useMemo(
		() => JSON.parse(debouncedJson) as EditAction[],
		[debouncedJson],
	);
};
