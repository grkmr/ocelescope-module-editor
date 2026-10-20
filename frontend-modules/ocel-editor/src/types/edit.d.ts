import type { ComponentType } from "react";
import type { EditMutationBody } from "../api/ocelEditor";

export type EditAction = EditMutationBody[number];

export type EditActionType = NonNullable<EditAction["type"]>;

export type EditActionOf<T extends EditActionType> = Extract<
	EditAction,
	{ type: T }
>;

/** A message for each field of the action that is invalid. */
export type ActionErrors<T extends EditActionType> = Partial<
	Record<keyof EditActionOf<T>, string>
>;

export type EditInputProps<T extends EditActionType> = {
	value: EditActionOf<T>;
	onChange: (value: EditActionOf<T>) => void;
	errors?: ActionErrors<T>;
};

export type ActionDefinition<T extends EditActionType> = {
	label: string;
	create: () => EditActionOf<T>;
	name: (action: EditActionOf<T>) => string;
	title: (action: EditActionOf<T>) => string;
	validate: (action: EditActionOf<T>) => ActionErrors<T>;
	Input: ComponentType<EditInputProps<T>>;
};
