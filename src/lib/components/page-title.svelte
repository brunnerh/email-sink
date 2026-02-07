<!--
	@component
	Page title component.

	Displays a page title with an optional subtitle.\
	Automatically updates the document title.
-->
<script lang="ts">
	import { FormLabel } from 'carbon-components-svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		/**
		 * Page title text.\
		 * Will be added to document `<title>`.\
		 * Displayed in the page if no default slot content is set.
		 */
		title: string;
		titleChildren?: Snippet<[any]>;
		subtitle?: Snippet;
	}

	const { title, titleChildren, subtitle }: Props = $props();
</script>

<svelte:head>
	<title>{title} - Email Sink</title>
</svelte:head>

<div class="mb-4">
	<h1>
		{#if titleChildren}
			{@render titleChildren(title)}
		{:else}
			{title}
		{/if}
	</h1>

	{#if subtitle}
		<FormLabel class="mt-2 mb-2">
			{@render subtitle?.()}
		</FormLabel>
	{/if}
</div>
