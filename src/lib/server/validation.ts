import { z } from 'zod';

export const requiredString = z.preprocess(
	(value) => (typeof value === 'string' ? value.trim() : value),
	z.string().min(1),
);

export const checkboxBoolean = z.preprocess(
	(value) => {
		if (value === 'on' || value === 'true' || value === 1)
			return true;

		return value;
	},
	z.boolean(),
);
