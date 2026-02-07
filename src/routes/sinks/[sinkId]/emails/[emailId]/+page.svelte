<script lang="ts">
	import { resolve } from '$app/paths';
	import CommaSeparatedList from '$lib/components/comma-separated-list.svelte';
	import Mailbox from '$lib/components/mailbox.svelte';
	import {
		Accordion,
		AccordionItem,
		FormLabel,
		Link,
	} from 'carbon-components-svelte';
	import AttachmentDisplay from '../../attachment-display.svelte';
	import PageTitle from '$lib/components/page-title.svelte';

	let { data } = $props();

	const formatDate = (value?: Date | string | null) => {
		if (!value)
			return 'Unknown date';

		const date = value instanceof Date ? value : new Date(value);
		return date.toLocaleString();
	};
</script>

<div class="flex flex-col gap-6">
	<header class="space-y-2">
		<PageTitle
			title={data.email?.subject?.trim() || 'No subject'}
		/>
		<Link href={resolve(`/sinks/${data.email?.sinkId ?? ''}`)}>
			Back to sink
		</Link>
	</header>

	<div class="grid gap-4 md:grid-cols-3 md:max-w-250">
		<div>
			<FormLabel>From</FormLabel>
			<div>
				<Mailbox
					name={data.email.fromName}
					address={data.email.fromAddress}
				/>
			</div>
		</div>
		<div>
			<FormLabel>To</FormLabel>
			<div>
				{@render recipients('to')}
			</div>
		</div>
		<div>
			<FormLabel>Cc</FormLabel>
			<div>
				{@render recipients('cc')}
			</div>
		</div>
		<div>
			<FormLabel>Received</FormLabel>
			<div>{formatDate(data.email?.receivedAt)}</div>
		</div>
		<div>
			<FormLabel>Message-ID</FormLabel>
			<div>{data.email?.messageId ?? 'Unknown'}</div>
		</div>

		{#snippet recipients(type: 'to' | 'cc')}
			{@const 			items = data.recipients.filter((recipient) =>
				recipient.type === type
			)}
			<CommaSeparatedList {items}>
				{#snippet template(item)}
					<Mailbox
						name={item.name}
						address={item.address}
					/>
				{/snippet}
				{#snippet empty()}<em>No recipients</em>{/snippet}
			</CommaSeparatedList>
		{/snippet}
	</div>

	<div>
		<h2 class="mb-4">Body</h2>
		{#if data.email?.textContent}
			<div class="space-y-2">
				<FormLabel>Text</FormLabel>
				<pre
					class="text-sm whitespace-pre-wrap wrap-break-word"
				>{data.email.textContent}</pre>
			</div>
		{/if}

		{#if data.email?.htmlContent}
			<div class="space-y-2">
				<FormLabel>HTML</FormLabel>
				<iframe
					class="w-full min-h-80"
					title="Email HTML content"
					sandbox=""
					srcdoc={data.email.htmlContent}
				></iframe>
			</div>
		{/if}

		{#if 			!data.email
				?.textContent &&
				!data.email
					?.htmlContent}
			<p>
				No content available for this email.
			</p>
		{/if}
	</div>

	<div>
		<h2 class="mb-4">Attachments</h2>
		{#if data.attachments?.length}
			<div class="flex gap-4 flex-wrap">
				{#each data.attachments as attachment (attachment.id)}
					<AttachmentDisplay
						{attachment}
						sinkId={data.email.sinkId}
						emailId={data.email.id}
					/>
				{/each}
			</div>
		{:else}
			<p>
				No attachments for this email.
			</p>
		{/if}
	</div>

	<div>
		<h2>Details</h2>
		<Accordion align="start">
			<AccordionItem title="Headers">
				{#each 					Object.entries(
						data.email?.headers ?? {},
					) as
					[name, value]
					(name)
				}
					<div class="mb-2 grid grid-cols-[max-content_1fr] gap-4">
						<div class="text-sm font-medium">
							{name}
						</div>
						<div
							class="text-sm whitespace-pre-wrap wrap-break-word"
						>
							{JSON.stringify(value)}
						</div>
					</div>
				{:else}
					<p>No headers available for this email.</p>
				{/each}
			</AccordionItem>
			<AccordionItem title="Raw">
				<pre
					class="text-sm whitespace-pre-wrap wrap-break-word"
				>{data.email?.rawContent ?? 'No raw content available.'}</pre>
			</AccordionItem>
		</Accordion>
	</div>
</div>
