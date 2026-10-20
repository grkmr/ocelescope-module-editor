import { useCurrentOcel } from "@ocelescope/core";
import { useFieldArray, useForm } from "react-hook-form";
import { useEdit } from "../api/ocelEditor";
import type { EditAction } from "../types/edit";

export type EditorForm = { name: string; pipeline: EditAction[] };

export const useEditor = () => {
	const { id: ocelId } = useCurrentOcel();
	const form = useForm<EditorForm>({
		defaultValues: { name: "", pipeline: [] },
	});
	const fieldArray = useFieldArray({ control: form.control, name: "pipeline" });

	const mutation = useEdit({
		mutation: { onSuccess: () => form.reset() },
	});

	const submit = form.handleSubmit(({ name, pipeline }) =>
		mutation.mutate({ ocelId, data: pipeline, params: { name } }),
	);

	return { form, ...fieldArray, ocelId, mutation, submit };
};
