<script lang="ts" generics="T">
	import type { Snippet } from 'svelte';

	interface Props {
		/** The list of items to comma separate. */
		items: T[];

		/**
		 * The maximum number of items to display.\
		 * `undefined` means no limit.
		 */
		limit?: number;

		/** Optional template to render each item with. */
		template?: Snippet<[T]>;

		/** Optional template to render when the list is empty. */
		empty?: Snippet<[]>;
	}

	let { items, limit, template, empty }: Props = $props();

	let displayedItems = $derived(items.slice(
		0,
		limit == null ? undefined : limit,
	));
</script>

{#each displayedItems as item, i}
	{#if template}
		{@render template(item)}{i < displayedItems.length - 1 ? ', ' : ''}
	{:else}
		{`${item}`}{i < displayedItems.length - 1 ? ', ' : ''}
	{/if}
{:else}
	{@render empty?.()}
{/each}

{#if items.length > displayedItems.length}
	…
{/if}
