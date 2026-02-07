<script lang="ts">
	import { Link } from 'carbon-components-svelte';

	interface Props {
		name: string | null;
		address: string | null;
	}
	const { name, address }: Props = $props();

	const addressText = $derived(address ?? 'unknown');
	const text = $derived(
		name ? `${name} <${addressText}>` : addressText,
	);
</script>

{#if !address}
	<span>{text}</span>
{:else}
	<Link href={`mailto:${address}`}>{text}</Link>
{/if}
