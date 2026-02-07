<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import {
		Button,
		ClickableTile,
		Dropdown,
		FormLabel,
		TextInput,
	} from 'carbon-components-svelte';
	import {
		Attachment,
		ChevronRight,
		Maximize,
		PreviousOutline,
		Settings,
		TrashCan,
	} from 'carbon-icons-svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { PageProps } from './$types';
	import AttachmentDisplay from './attachment-display.svelte';
	import Mailbox from '$lib/components/mailbox.svelte';
	import CommaSeparatedList from '$lib/components/comma-separated-list.svelte';
	import { confirm } from '$lib/components/dialogs/generic-dialogs';
	import PageTitle from '$lib/components/page-title.svelte';

	type PageData = PageProps['data'];
	type Email = PageData['emails'][number];
	type Recipient = PageData['recipients'][number];
	type Attachment = PageData['attachments'][number];
	type GroupOptionId = 'none' | 'sender' | 'recipient';

	const { data } = $props();
	const emailTotal = $derived(
		(data as { emailTotal?: number }).emailTotal ??
			data.emails.length,
	);
	let searchQuery = $state('');
	let groupBy = $state<GroupOptionId>('none');
	let selectedEmailId = $derived<number | null>(
		data.emails[0]?.id ?? null,
	);

	const groupOptions: Array<{ id: GroupOptionId; text: string }> = [
		{ id: 'none', text: 'No grouping' },
		{ id: 'sender', text: 'Sender' },
		{ id: 'recipient', text: 'Recipient' },
	];

	const recipientsByEmail = $derived.by(() => {
		const map = new SvelteMap<number, Recipient[]>();
		for (const recipient of data.recipients ?? []) {
			const existing = map.get(recipient.emailId) ?? [];
			existing.push(recipient);
			map.set(recipient.emailId, existing);
		}
		return map;
	});

	const attachmentsByEmail = $derived.by(() => {
		const map = new SvelteMap<number, Attachment[]>();
		for (const attachment of data.attachments ?? []) {
			const existing = map.get(attachment.emailId) ?? [];
			existing.push(attachment);
			map.set(attachment.emailId, existing);
		}
		return map;
	});

	function formatAddress(
		name?: string | null,
		address?: string | null,
	) {
		if (name && address)
			return `${name} <${address}>`;
		return name || address || 'Unknown';
	}

	function formatDate(value?: Date | string | null) {
		if (!value)
			return 'Unknown date';
		const date = value instanceof Date ? value : new Date(value);
		return date.toLocaleString();
	}

	async function onDeleteEmailClick(
		event: MouseEvent & { currentTarget: HTMLElement },
	) {
		event.preventDefault();

		const form = event.currentTarget.closest('form');
		if (form == null) {
			throw new Error(
				'Could not find form element for delete action.',
			);
		}

		const confirmed = await confirm({
			title: 'Delete email',
			message:
				'This will permanently delete the email and attachments.',
			danger: true,
			primaryButtonText: 'Delete',
			secondaryButtonText: 'Cancel',
		});

		if (!confirmed)
			return;

		form.requestSubmit();
	}

	async function onClearEmailsClick(
		event: MouseEvent & { currentTarget: HTMLElement },
	) {
		event.preventDefault();

		const form = event.currentTarget.closest('form');
		if (form == null) {
			throw new Error(
				'Could not find form element for clear action.',
			);
		}

		const confirmed = await confirm({
			title: 'Clear sink',
			message:
				'This will permanently delete all emails in this sink.',
			danger: true,
			primaryButtonText: 'Delete all',
			secondaryButtonText: 'Cancel',
		});

		if (!confirmed)
			return;

		form.requestSubmit();
	}

	function getRecipients(emailId: number) {
		return recipientsByEmail.get(emailId) ?? [];
	}

	function getPrimaryRecipient(emailId: number) {
		const recipients = getRecipients(emailId);
		return recipients.find((recipient: Recipient) =>
			recipient.type === 'to'
		) ??
			recipients[0];
	}

	function getSenderLabel(email: Email) {
		return formatAddress(email.fromName, email.fromAddress) ||
			'Unknown sender';
	}

	function getRecipientLabel(email: Email) {
		const recipient = getPrimaryRecipient(email.id);
		if (!recipient)
			return 'Unknown recipient';
		return formatAddress(recipient.name, recipient.address) ||
			'Unknown recipient';
	}

	function getRecipientGroupLabels(email: Email) {
		const recipients = getRecipients(email.id);
		if (!recipients.length)
			return ['Unknown recipient'];

		const labels: string[] = [];
		for (const recipient of recipients) {
			const label =
				formatAddress(recipient.name, recipient.address) ||
				'Unknown recipient';
			if (!labels.includes(label))
				labels.push(label);
		}

		return labels;
	}

	const filteredEmails = $derived.by((): Email[] => {
		const emails = data.emails ?? [];
		const query = searchQuery.trim().toLowerCase();
		if (!query)
			return emails;

		return emails.filter((email) => {
			const recipients = getRecipients(email.id)
				.map((recipient) =>
					`${recipient.name ?? ''} ${recipient.address ?? ''}`
				)
				.join(' ');
			const haystack = [
				email.subject ?? '',
				email.fromName ?? '',
				email.fromAddress ?? '',
				recipients,
			].join(' ').toLowerCase();

			return haystack.includes(query);
		});
	});

	const groupedEmails = $derived.by(() => {
		const emails = filteredEmails;
		if (groupBy === 'none')
			return [{ id: 'all', label: 'All emails', emails }];

		const groups = new SvelteMap<string, Email[]>();
		for (const email of emails) {
			if (groupBy === 'sender') {
				const label = getSenderLabel(email) || 'Unknown sender';
				const existing = groups.get(label) ?? [];
				existing.push(email);
				groups.set(label, existing);
				continue;
			}

			const labels = getRecipientGroupLabels(email);
			for (const label of labels) {
				const existing = groups.get(label) ?? [];
				existing.push(email);
				groups.set(label, existing);
			}
		}

		return Array.from(groups, ([label, emails]) => ({
			id: label,
			label,
			emails,
		}));
	});

	const hasEmails = $derived.by(() => {
		if (groupedEmails.length === 0)
			return false;
		return groupedEmails[0].emails.length > 0;
	});

	const selectedEmail = $derived.by(() => {
		if (selectedEmailId === null)
			return null;

		return filteredEmails.find((email) =>
			email.id === selectedEmailId
		) ?? null;
	});

	const selectedEmailKey = $derived(selectedEmail?.id ?? null);
	const hasSelection = $derived(selectedEmail != null);

	const getAttachmentCount = (emailId: number) =>
		attachmentsByEmail.get(emailId)?.length ?? 0;

	const getAttachments = (emailId: number) =>
		attachmentsByEmail.get(emailId) ?? [];
</script>

<div class="flex flex-col gap-6">
	<div
		class="space-y-1 flex flex-wrap gap-x-8 gap-y-4 justify-between items-start"
	>
		<PageTitle title={data.sink.name} />

		<div class="flex items-center gap-2">
			<form method="POST" action="?/clearEmails" use:enhance>
				<Button
					kind="danger-ghost"
					icon={TrashCan}
					onclick={onClearEmailsClick}
				>
					Clear
				</Button>
			</form>
			{#if data.isAdmin}
				<Button
					kind="tertiary"
					icon={Settings}
					href={resolve(`/sinks/${data.sink.id}/settings`)}
				>
					Settings
				</Button>
			{/if}
		</div>
	</div>

	<div
		class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"
	>
		<div class="flex flex-col gap-4 sm:flex-row sm:items-end">
			<TextInput
				id="email-search"
				labelText="Search"
				placeholder="Search emails"
				bind:value={searchQuery}
			/>
			<Dropdown
				items={groupOptions}
				labelText="Group by"
				bind:selectedId={groupBy}
			/>
		</div>
	</div>

	<div class="lg:hidden">
		{#if hasSelection}
			<div class="flex flex-col gap-4">
				<div>
					<Button
						kind="tertiary"
						onclick={() => selectedEmailId = null}
						icon={PreviousOutline}
					>
						Back to email list
					</Button>
				</div>
				{#if selectedEmail}
					{@render selectedEmailDetails(selectedEmail)}
				{/if}
			</div>
		{:else}
			<div class="flex flex-col gap-4">
				{#if !hasEmails}
					<p>No emails received yet.</p>
				{:else}
					<div class="grid gap-6">
						{#each groupedEmails as group (group.id)}
							<div class="space-y-3">
								{#if groupBy !== 'none'}
									<h2 class="text-sm">{group.label}</h2>
								{/if}
								<div class="grid gap-3">
									{#each group.emails as email (email.id)}
										{@render emailTile(email)}
									{/each}
								</div>
							</div>
						{/each}
					</div>
				{/if}

				{#if emailTotal > data.emails.length}
					<p class="text-sm">
						Showing latest {data.emails.length} of {emailTotal}
						emails.
					</p>
				{/if}
			</div>
		{/if}
	</div>

	<div
		class="hidden lg:flex lg:flex-row lg:gap-6 lg:min-h-0 lg:h-[calc(100vh-20rem)]"
	>
		<div class="flex flex-col gap-4 w-1/3 min-h-0 overflow-y-auto">
			{#if !hasEmails}
				<p>No emails received yet.</p>
			{:else}
				<div class="grid gap-6">
					{#each groupedEmails as group (group.id)}
						<div class="space-y-3">
							{#if groupBy !== 'none'}
								<h2 class="text-sm">{group.label}</h2>
							{/if}
							<div class="grid gap-3">
								{#each group.emails as email (email.id)}
									{@render emailTile(email)}
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			{#if emailTotal > data.emails.length}
				<p class="text-sm">
					Showing latest {data.emails.length} of {emailTotal} emails.
				</p>
			{/if}
		</div>

		{#if selectedEmail}
			<div
				class="grid place-content-stretch flex-1 overflow-y-auto min-h-full p-0"
				style="border: 1px solid var(--cds-border-subtle)"
			>
				{@render selectedEmailDetails(selectedEmail)}
			</div>
		{:else if hasEmails}
			<p class="p-4">Select an email to view details.</p>
		{/if}
	</div>
</div>

{#snippet emailTile(email: Email)}
	{@const attachmentCount = getAttachmentCount(email.id)}
	<ClickableTile
		class="text-left space-y-1"
		style={`
			border-left: 4px solid ${
			selectedEmailId == email.id
				? 'var(--cds-support-blue)'
				: 'transparent'
		}`}
		on:click={() => selectedEmailId = email.id}
	>
		{#if attachmentCount > 0}
			<div class="float-right flex items-center gap-1">
				<Attachment />
				{attachmentCount}
			</div>
		{/if}
		<div class="font-semibold">
			{email.subject?.trim() || 'No subject'}
		</div>
		<div class="text-sm">
			From: {getSenderLabel(email)}
		</div>
		<div class="text-sm">
			To: {getRecipientLabel(email)}
		</div>
		<div class="text-sm">
			Received: {formatDate(email.receivedAt)}
		</div>
	</ClickableTile>
{/snippet}

{#snippet selectedEmailDetails(selectedEmail: Email)}
	<div
		data-email-details
		class="p-4 relative isolate group"
		style="background: var(--cds-ui-background)"
	>
		<div class="space-y-4">
			<div>
				<h2>
					{
						selectedEmail.subject?.trim() ||
							'No subject'
					}
				</h2>
				<p class="text-sm">
					From: <Mailbox
						name={selectedEmail.fromName}
						address={selectedEmail.fromAddress}
					/>
				</p>
				<p class="text-sm">
					To: {@render recipients('to')}
				</p>
				<p class="text-sm">
					Received: {formatDate(selectedEmail.receivedAt)}
				</p>
			</div>

			{#snippet recipients(type: 'to' | 'cc')}
				{@const 			items = getRecipients(selectedEmail.id).filter(
				(recipient) => recipient.type === type,
			)}
				<CommaSeparatedList {items} limit={3}>
					{#snippet template(item)}
						<Mailbox
							name={item.name}
							address={item.address}
						/>
					{/snippet}
				</CommaSeparatedList>
			{/snippet}

			{#if selectedEmail.textContent}
				<div class="space-y-2">
					<FormLabel>Text</FormLabel>
					<pre
						class="text-sm whitespace-pre-wrap wrap-break-word"
					>
{
						selectedEmail.textContent
					}</pre>
				</div>
			{/if}

			{#if selectedEmail.htmlContent}
				<div class="space-y-2">
					<FormLabel>HTML</FormLabel>
					<iframe
						class="w-full min-h-80"
						title="Email HTML content"
						sandbox=""
						srcdoc={selectedEmail.htmlContent}
					></iframe>
				</div>
			{/if}

			{#if 			!selectedEmail.textContent && !selectedEmail.htmlContent}
				<p>No content available for this email.</p>
			{/if}

			{#if 			selectedEmailKey &&
				getAttachments(selectedEmailKey).length}
				<div class="space-y-2">
					<FormLabel>Attachments</FormLabel>
					<div class="flex gap-4 flex-wrap">
						{#each getAttachments(selectedEmailKey) as
							attachment
							(attachment.id)
						}
							<AttachmentDisplay
								{attachment}
								sinkId={selectedEmail.sinkId}
								emailId={selectedEmail.id}
							/>
						{/each}
					</div>
				</div>
			{/if}
		</div>

		<div
			class="absolute top-0 right-0 opacity-0 group-hover:opacity-100 has-focus-visible:opacity-100"
		>
			<form
				method="POST"
				action="?/deleteEmail"
				class="contents"
				use:enhance
			>
				<input
					type="hidden"
					name="emailId"
					value={selectedEmail.id}
				/>
				<Button
					kind="ghost"
					icon={TrashCan}
					iconDescription="Delete email"
					onclick={onDeleteEmailClick}
					tooltipAlignment="end"
				/>
			</form>
			<Button
				kind="ghost"
				onclick={(e) => {
					const detailDiv = e.currentTarget
						.closest(
							'[data-email-details]',
						) as HTMLDivElement;
					if (!detailDiv)
						return;
					if (document.fullscreenElement)
						document.exitFullscreen();
					else
						detailDiv.requestFullscreen();
				}}
				icon={Maximize}
				iconDescription="Fullscreen"
				tooltipAlignment="end"
			/>
			<Button
				kind="ghost"
				href={resolve(
					`/sinks/${data.sink.id}/emails/${selectedEmail.id}`,
				)}
				icon={ChevronRight}
				iconDescription="View full details"
				tooltipAlignment="end"
			/>
		</div>
	</div>
{/snippet}
