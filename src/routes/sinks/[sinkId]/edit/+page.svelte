<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import SinkFormFields from '$lib/components/sink-form-fields.svelte';
	import {
		Button,
		ButtonSet,
		InlineNotification,
		Link,
	} from 'carbon-components-svelte';
	import { Save } from 'carbon-icons-svelte';
	import PageTitle from '$lib/components/page-title.svelte';

	let { data, form } = $props();
</script>

<div class="flex flex-col gap-6">
	<div class="space-y-2">
		<PageTitle title="Edit sink" />
		<Link
			href={resolve(`/sinks/${data.sink.id}/settings`)}
		>
			Back to sink settings
		</Link>
	</div>

	{#if form?.error}
		<InlineNotification
			kind="error"
			title="Unable to update sink"
			subtitle={form.error}
			hideCloseButton
		/>
	{/if}

	<div class="max-w-md">
		<form method="POST" action="?/updateSink" use:enhance>
			<SinkFormFields
				name={data.sink.name}
				slug={data.sink.slug}
				showSlugWarning
				isAuthEnabled={data.sink.isAuthEnabled}
			/>
			<ButtonSet class="mt-4">
				<Button type="submit" icon={Save}>
					Update sink
				</Button>
				<Button
					kind="secondary"
					href={resolve(
						`/sinks/${data.sink.id}/settings`,
					)}
				>
					Cancel
				</Button>
			</ButtonSet>
		</form>
	</div>
</div>
