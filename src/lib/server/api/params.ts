import { error } from '@sveltejs/kit';

export const parseNumericId = (value: string | undefined, name: string) => {
	if (!value)
		error(400, `Missing ${name}`);

	const id = Number(value);
	if (!Number.isInteger(id) || id <= 0)
		error(400, `Invalid ${name}`);

	return id;
};
