<script lang="ts">
	import { resolve } from '$app/paths';
	import {
		Button,
		ClickableTile,
		FormGroup,
	} from 'carbon-components-svelte';
	import { Add } from 'carbon-icons-svelte';
	import PageTitle from '$lib/components/page-title.svelte';
	let { data } = $props();
</script>

<div class="flex flex-wrap gap-x-8 gap-y-4 justify-between mb-8 items-start">
	<PageTitle title="Sinks" />
	{#if data.isAdmin}
		<Button href={resolve('/sinks/new')} icon={Add}>
			Create sink
		</Button>
	{/if}
</div>

{#if data.sinks.length}
	<div class="grid gap-4">
		{#each data.sinks as sink (sink.id)}
			{@render sinkTile(sink)}
		{/each}
	</div>
{:else}
	<p>
		No sinks yet.
	</p>
{/if}

{#snippet sinkTile(sink: (typeof data.sinks)[0])}
	<ClickableTile href={resolve(`/sinks/${sink.id}`)}>
		<div class="font-semibold mb-4">
			{sink.name}
		</div>
		<div class="flex gap-8">
			<div>
				<FormGroup legendText="Endpoints" noMargin>
					<div class="flex flex-col gap-1">
						<pre>{`/api/ingest/${sink.slug}/raw`}</pre>
						<pre>{`/api/ingest/${sink.slug}/form`}</pre>
					</div>
				</FormGroup>
			</div>
			<div>
				<FormGroup legendText="Emails" noMargin>
					{sink.emailCount ?? 0}
				</FormGroup>
			</div>
		</div>
	</ClickableTile>
{/snippet}
