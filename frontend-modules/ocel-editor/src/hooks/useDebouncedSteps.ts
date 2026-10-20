import { useDebouncedValue } from "@mantine/hooks";
import { useMemo } from "react";
import type { EditAction } from "../types/edit";

export const useDebouncedSteps = (steps: EditAction[] = []) => {
	// useDebouncedValue compares by reference, and steps is a new array every
	// render, so debounce its JSON instead, which compares by content
	const [debouncedJson] = useDebouncedValue(JSON.stringify(steps), 400);

	return useMemo(
		() => JSON.parse(debouncedJson) as EditAction[],
		[debouncedJson],
	);
};
