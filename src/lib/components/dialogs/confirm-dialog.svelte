<!--
	@component Shows a confirmation dialog.  
	Use via function from `generic-dialog.ts`.
 -->
<script lang="ts" generics="T">
	import { carbonClasses } from '$lib/client/carbon';
	import type { MaybePromise } from '$lib/shared/typing';
	import { Modal } from 'carbon-components-svelte';
	import type { Component, ComponentProps } from 'svelte';
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

		/** Whether the primary button should be styled as dangerous. */
		danger?: boolean;

		/** The text for the primary button. */
		primaryButtonText?: string;

		/** The text for the secondary button. */
		secondaryButtonText?: string;

		/** Whether the primary button is disabled. */
		primaryButtonDisabled?: boolean;

		/** The icon for the primary button. */
		primaryButtonIcon?: Component;

		/** Result callback. */
		onResult(result: boolean): void;

		/**
		 * Optional submit handler.\
		 * Can be used to e.g. intercept the closing of the dialog.\
		 * If the function returns `false`, the dialog will not be closed.
		 *
		 * Function is only called after regular form validation has passed.
		 */
		onSubmit?(): MaybePromise<boolean | void>;
	}

	let {
		title = '',
		message,
		size = 'xs',
		danger = false,
		primaryButtonText = 'OK',
		secondaryButtonText = 'Cancel',
		primaryButtonDisabled = false,
		primaryButtonIcon = undefined,
		onResult,
		onSubmit,
	}: Props<T> = $props();

	let open = $state(true);
	let form: HTMLFormElement = $state()!;
	let result = false;

	async function onSubmitInternal() {
		const valid = form.reportValidity();
		if (valid == false)
			return;

		if (onSubmit) {
			const submitResult = await onSubmit();
			if (submitResult === false)
				return;
		}

		onResultInternal(true);
	}

	function onResultInternal(value: boolean) {
		result = value;
		open = false;
	}

	function onClose() {
		onResult(result);
	}
</script>

<Modal
	bind:open
	size={size == 'md' ? undefined : size}
	{danger}
	modalHeading={title}
	preventCloseOnClickOutside
	{primaryButtonText}
	primaryButtonDisabled={primaryButtonDisabled || open == false}
	{primaryButtonIcon}
	{secondaryButtonText}
	hasForm
	shouldSubmitOnEnter={false}
	on:click:button--secondary={() => onResultInternal(false)}
	on:submit={onSubmitInternal}
	on:close={onClose}
>
	<form
		class={carbonClasses.form}
		bind:this={form}
		onsubmit={onSubmitInternal}
	>
		{#if typeof message == 'string'}
			<div class="contents whitespace-pre-line">{message}</div>
		{:else}
			{@render message.template((message as { args: T }).args)}
		{/if}
	</form>
</Modal>
