import { Alert, Button, Menu, Stack } from "@mantine/core";
import { Plus } from "lucide-react";
import { Controller, useWatch } from "react-hook-form";
import { useEditor } from "../../hooks/useEditor";
import { EditorHeader } from "./EditorHeader";
import { actions, actionTypes, EditorInput, validateAction } from "./inputs";

const OcelEditor = () => {
	const { form, fields, append, remove, move, ocelId, mutation, submit } =
		useEditor();
	const pipeline = useWatch({ control: form.control, name: "pipeline" });

	const validSteps = (index: number) =>
		pipeline.slice(0, index).filter((step) => validateAction(step) === true);

	if (!ocelId) {
		return <Alert color="yellow">Select an OCEL to edit.</Alert>;
	}

	return (
		<form onSubmit={submit}>
			<Stack>
				<EditorHeader
					nameInput={form.register("name", {
						required: "Give the new OCEL a name",
					})}
					nameError={form.formState.errors.name?.message}
					loading={mutation.isPending}
				/>

				{mutation.isError && (
					<Alert color="red">Editing the OCEL failed.</Alert>
				)}
				{mutation.isSuccess && (
					<Alert color="green">The new OCEL was created.</Alert>
				)}

				{fields.map((field, index) => (
					<Controller
						key={field.id}
						control={form.control}
						name={`pipeline.${index}`}
						rules={{ validate: validateAction }}
						render={({ field: { value, onChange }, fieldState }) => (
							<EditorInput
								value={value}
								onChange={onChange}
								steps={validSteps(index)}
								onMoveUp={index > 0 ? () => move(index, index - 1) : undefined}
								onMoveDown={
									index < fields.length - 1
										? () => move(index, index + 1)
										: undefined
								}
								onRemove={() => remove(index)}
								invalid={fieldState.invalid}
							/>
						)}
					/>
				))}

				<Menu>
					<Menu.Target>
						<Button variant="light" radius={0} leftSection={<Plus size={16} />}>
							Add step
						</Button>
					</Menu.Target>
					<Menu.Dropdown>
						{actionTypes.map((type) => (
							<Menu.Item
								key={type}
								onClick={() => append(actions[type].create())}
							>
								{actions[type].label}
							</Menu.Item>
						))}
					</Menu.Dropdown>
				</Menu>
			</Stack>
		</form>
	);
};

export default OcelEditor;
