<script>
	import {
		Button,
		InlineNotification,
	} from 'carbon-components-svelte';
	import { Add } from 'carbon-icons-svelte';
	import SinkFormFields from '$lib/components/sink-form-fields.svelte';
	import { enhance } from '$app/forms';
	import PageTitle from '$lib/components/page-title.svelte';

	let { form } = $props();
</script>

<div class="flex flex-col gap-6">
	<PageTitle title="Create sink" />

	{#if form?.error}
		<InlineNotification
			kind="error"
			title="Unable to create sink"
			subtitle={form.error}
			hideCloseButton
		/>
	{/if}

	<div class="max-w-md">
		<form method="POST" action="?/createSink" use:enhance>
			<SinkFormFields />
			<div class="mt-4">
				<Button type="submit" icon={Add}>
					Create sink
				</Button>
			</div>
		</form>
	</div>
</div>
