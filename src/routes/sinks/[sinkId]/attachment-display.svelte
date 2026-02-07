<script lang="ts">
	import { resolve } from '$app/paths';
	import type { Snippet } from 'svelte';
	import { Button, Tile } from 'carbon-components-svelte';
	import { Download, View } from 'carbon-icons-svelte';
	import { alert } from '$lib/components/dialogs/generic-dialogs';

	interface Props {
		sinkId: number;
		emailId: number;
		attachment: {
			id: number;
			filename?: string | null;
			contentType?: string | null;
			size?: number | null;
		};
		light?: boolean;
	}

	const { sinkId, emailId, attachment, light = false }: Props =
		$props();
	const getAttachmentUrl = () =>
		resolve(
			`/sinks/${sinkId}/emails/${emailId}/attachments/${attachment.id}`,
		);
	const isTextAttachment = () =>
		(attachment.contentType ?? '').toLowerCase().startsWith(
			'text/',
		);

	async function onViewAttachmentClick() {
		try {
			const response = await fetch(getAttachmentUrl());
			if (response.ok == false)
				throw new Error('Failed.');

			const content = await response.text();

			await alert({
				title: attachment.filename ?? 'Attachment preview',
				size: 'md',
				message: {
					template: textPreview,
					args: { content },
				},
				lightDismiss: true,
			});
		}
		catch {
			alert({
				title: 'Unable to load attachment',
				message: 'Download failed. Please try again.',
			});
		}
	}

	function formatBytes(size?: number | null) {
		if (size === null || size === undefined)
			return 'Unknown size';

		if (size < 1024)
			return `${size} B`;

		const kb = size / 1024;
		if (kb < 1024)
			return `${kb.toFixed(1)} KB`;

		const mb = kb / 1024;
		return `${mb.toFixed(1)} MB`;
	}
</script>

<Tile class="inline-block max-w-100 min-w-max" {light}>
	<div
		class="flex flex-wrap items-center justify-between gap-4"
	>
		<div>
			<div>
				{
					attachment.filename ??
						'Untitled attachment'
				}
			</div>
			<div class="text-sm">
				{formatBytes(attachment.size)}
				<span>|</span>
				{attachment.contentType ?? 'Unknown type'}
			</div>
		</div>
		<div class="flex items-center gap-2">
			{#if isTextAttachment()}
				<Button
					kind="ghost"
					icon={View}
					iconDescription="View attachment"
					tooltipAlignment="end"
					size="small"
					onclick={onViewAttachmentClick}
				/>
			{/if}
			<Button
				kind="ghost"
				icon={Download}
				iconDescription="Download attachment"
				tooltipAlignment="end"
				size="small"
				href={getAttachmentUrl()}
			/>
		</div>
	</div>
</Tile>

{#snippet textPreview({ content }: { content: string })}
	<pre class="whitespace-pre-wrap wrap-break-word">{content}</pre>
{/snippet}
