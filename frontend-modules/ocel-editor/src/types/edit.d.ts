import type { ComponentType, ReactNode } from "react";
import type { SaveAsOcelMutationBody } from "../api/ocelEditor";

export type EditAction = SaveAsOcelMutationBody[number];

export type EditActionType = NonNullable<EditAction["type"]>;

export type EditActionOf<T extends EditActionType> = Extract<
	EditAction,
	{ type: T }
>;

export type ActionErrors<T extends EditActionType> = Partial<
	Record<keyof EditActionOf<T>, string>
>;

export type Pipeline = { steps: EditAction[] };

export type ActionPanel<T extends EditActionType> = ComponentType<{
	ocelId: string;
	action: EditActionOf<T>;
	onChange: (action: EditActionOf<T>) => void;
	/** The complete steps before this one: the panel shows the log as they leave it. */
	before: EditAction[];
}>;

export type ActionKind<T extends EditActionType> = {
	title: string;
	description: string;
	Panel: ActionPanel<T>;
	create: () => EditActionOf<T>;
	summary: (action: EditActionOf<T>) => ReactNode;
	/** What is missing or wrong, by field; empty when the step is complete. */
	validate: (action: EditActionOf<T>) => ActionErrors<T>;
};
