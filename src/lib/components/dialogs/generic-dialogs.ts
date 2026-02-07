import { modalDestroyDelay } from '$lib/client/carbon';
import type { KeyedOmit } from '$lib/shared/typing';
import { type ComponentProps, mount, unmount } from 'svelte';
import AlertDialog from './alert-dialog.svelte';
import ConfirmDialog from './confirm-dialog.svelte';

/**
 * Shows a Carbon alert dialog.
 * @param messageOrOptions Message or options for the dialog.
 * @returns Promise that resolves on close.
 */
export function alert<T>(
	messageOrOptions:
		| string
		| KeyedOmit<ComponentProps<AlertDialog<T>>, 'onClose'>,
) {
	const options = typeof messageOrOptions === 'string'
		? { message: messageOrOptions }
		: messageOrOptions;

	return new Promise<void>((resolve) => {
		const dialog = mount(AlertDialog, {
			target: document.body,
			props: {
				...options,
				onClose() {
					resolve();
					setTimeout(() => unmount(dialog), modalDestroyDelay);
				},
			} as ComponentProps<AlertDialog<any>>,
		});
	});
}

/**
 * Shows a Carbon confirm dialog.
 * @param options Options for the dialog.
 * @returns Promise that resolves on user choice.
 *   - Primary: `true`
 *   - Secondary: `false`
 */
export function confirm<T>(
	options: KeyedOmit<ComponentProps<ConfirmDialog<T>>, 'onResult'>,
) {
	return new Promise<boolean>((resolve) => {
		const dialog = mount(ConfirmDialog, {
			target: document.body,
			props: {
				...options,
				onResult(result: boolean) {
					resolve(result);
					setTimeout(() => unmount(dialog), modalDestroyDelay);
				},
			} as ComponentProps<ConfirmDialog<any>>,
		});
	});
}

/**
 * Shows a generic error alert.
 * @returns Alert dialog promise.
 */
export function genericErrorAlert() {
	return alert({
		title: 'Error',
		message: 'An unknown error occurred.',
	});
}
