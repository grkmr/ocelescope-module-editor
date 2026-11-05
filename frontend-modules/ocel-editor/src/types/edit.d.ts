import type { StepErrors, StepKind, StepOf, StepPanel } from "@ocelescope/core";
import type { SaveAsOcelMutationBody } from "../api/ocelEditor";

export type EditAction = SaveAsOcelMutationBody[number];

export type EditActionType = NonNullable<EditAction["type"]>;

export type EditActionOf<T extends EditActionType> = StepOf<EditAction, T>;

export type ActionErrors<T extends EditActionType> = StepErrors<
	EditActionOf<T>
>;

export type ActionPanel<T extends EditActionType> = StepPanel<EditActionOf<T>>;

export type ActionKind<T extends EditActionType> = StepKind<EditActionOf<T>>;
