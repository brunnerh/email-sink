/**
 * Transition/animation durations.\
 * See [duration tokens](https://carbondesignsystem.com/guidelines/motion/overview/#duration-tokens).
 */
export const durations = Object.freeze(
	{
		fast01: 70,
		fast02: 110,
		moderate01: 150,
		moderate02: 240,
		slow01: 400,
		slow02: 700,
	} as const,
);

/**
 * Time to wait before destroying a Modal.\
 * Based on close animation duration ({@link durations#moderate02}).
 */
export const modalDestroyDelay = durations.moderate02;

const prefix = 'bx--';

export const carbonClasses = Object.freeze({
	form: prefix + 'form',
});
