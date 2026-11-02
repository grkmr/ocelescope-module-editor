import type { AxiosError } from "axios";

/** Why the backend refused a request, as it says, or `fallback`. */
export const apiError = (error: unknown, fallback: string) => {
	const detail = (error as AxiosError<{ detail?: unknown }>).response?.data
		?.detail;
	return typeof detail === "string" ? detail : fallback;
};
