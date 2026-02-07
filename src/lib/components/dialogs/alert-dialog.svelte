<!--
	@component Shows an alert dialog.  
	Use via function from `generic-dialog.ts`.
 -->
<script lang="ts" generics="T">
	import { Modal } from 'carbon-components-svelte';
	import type { ComponentProps } from 'svelte';
	import type { StringOrSnippet } from '../types';

	interface Props<T> {
		/** The title of the dialog. */
		title?: string;

		/** The message to show in the dialog. */
		message: StringOrSnippet<T>;

		/**
		 * The size of the dialog.
		 * @default 'xs'
		 */
		size?: ComponentProps<Modal>['size'] | 'md';

		/**
		 * If true, the dialog can be closed by clicking outside of it.
		 */
		lightDismiss?: boolean;

		/** Close callback. */
		onClose(): void;
	}

	let {
		title = '',
		message,
		size = 'xs',
		lightDismiss = false,
		onClose,
	}: Props<T> = $props();

	let open = $state(true);
</script>

<Modal
	bind:open
	size={size == 'md' ? undefined : size}
	passiveModal
	preventCloseOnClickOutside={!lightDismiss}
	modalHeading={title}
	on:submit={() => open = false}
	on:close={onClose}
>
	{#if typeof message == 'string'}
		<div class="contents whitespace-pre-line">{message}</div>
	{:else}
		{@render message.template((message as { args: T }).args)}
	{/if}
</Modal>
