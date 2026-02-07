<script lang="ts">
	import { enhance } from '$app/forms';
	import { resolve } from '$app/paths';
	import {
		Button,
		FormGroup,
		InlineNotification,
		Link,
		Select,
		SelectItem,
		TextInput,
		Tile,
	} from 'carbon-components-svelte';
	import { Add, Edit, TrashCan } from 'carbon-icons-svelte';
	import { confirm } from '$lib/components/dialogs/generic-dialogs';
	import PageTitle from '$lib/components/page-title.svelte';

	let { data, form } = $props();

	type RuleType = 'equals' | 'contains' | 'starts_with' | 'ends_with';
	const ruleTypeOptions: Array<{ id: RuleType; text: string }> = [
		{ id: 'equals', text: 'Equals' },
		{ id: 'contains', text: 'Contains' },
		{ id: 'starts_with', text: 'Starts with' },
		{ id: 'ends_with', text: 'Ends with' },
	];

	function formatDate(value?: Date | string | null) {
		if (!value)
			return 'Unknown date';
		const date = value instanceof Date ? value : new Date(value);
		return date.toLocaleString();
	}

	async function onDeleteClick(
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
			title: 'Delete sink',
			message:
				'This will permanently delete the sink and its emails.',
			danger: true,
			primaryButtonText: 'Delete',
			secondaryButtonText: 'Cancel',
		});

		if (!confirmed)
			return;

		form.requestSubmit();
	}
</script>

<div class="flex flex-col gap-6 max-w-200">
	<div class="space-y-2">
		<PageTitle title={`${data.sink.name} Settings`} />
		<Link
			href={resolve(`/sinks/${data.sink.id}`)}
		>
			Back to emails
		</Link>
	</div>

	{#if form?.error}
		<InlineNotification
			kind="error"
			title="Action failed"
			subtitle={form.error}
			hideCloseButton
		/>
	{/if}

	<div>
		<Button
			kind="tertiary"
			size="small"
			href={resolve(`/sinks/${data.sink.id}/edit`)}
			icon={Edit}
		>
			Edit sink
		</Button>
	</div>

	<FormGroup legendText="Endpoints" noMargin>
		<div class="flex flex-col gap-1">
			<pre>{`/api/ingest/${data.sink.slug}/raw`}</pre>
			<pre>{`/api/ingest/${data.sink.slug}/form`}</pre>
		</div>
	</FormGroup>

	<div class="space-y-4">
		<h2>API keys</h2>

		{#if data.sink.isAuthEnabled == false}
			<InlineNotification
				kind="warning"
				title="Authentication disabled."
				subtitle="API keys are currently not required to send to this sink."
				hideCloseButton
				lowContrast
				statusIconDescription=""
			/>
		{:else}
			<form
				class="space-y-4"
				method="POST"
				action="?/createApiKey"
				use:enhance
			>
				<TextInput
					id="api-key-name"
					name="name"
					labelText="Name"
					required
				/>

				{#if form?.apiKey}
					<InlineNotification
						kind="success"
						title="API key created"
						subtitle={`Copy this key now: ${form.apiKey}`}
						hideCloseButton
					/>
				{/if}

				<div class="mt-4">
					<Button kind="ghost" size="small" type="submit" icon={Add}>
						Create key
					</Button>
				</div>
			</form>
		{/if}

		{#if data.apiKeys?.length}
			<div class="grid gap-4">
				{#each data.apiKeys as key (key.id)}
					<Tile>
						<div
							class="flex flex-wrap items-center justify-between gap-4"
						>
							<div>
								<div class="font-semibold">{key.name}</div>
								<div class="text-sm">
									Created: {
										formatDate(
											key.createdAt,
										)
									}
								</div>
								{#if key.lastUsedAt}
									<div class="text-sm">
										Last used: {
											formatDate(
												key.lastUsedAt,
											)
										}
									</div>
								{/if}
							</div>
							<form
								method="POST"
								action="?/deleteApiKey"
								use:enhance
							>
								<input
									type="hidden"
									name="keyId"
									value={key.id}
								/>
								<Button
									kind="ghost"
									type="submit"
									icon={TrashCan}
									iconDescription="Delete"
									tooltipAlignment="end"
								/>
							</form>
						</div>
					</Tile>
				{/each}
			</div>
		{:else}
			<p>No API keys yet.</p>
		{/if}
	</div>

	<div class="space-y-4">
		<h2>Authorization rules</h2>
		<p>
			Governs who can access this sink. Rules match on the email address
			of the user.
		</p>
		<div class="space-y-4">
			<form method="POST" action="?/createAuthRule" use:enhance>
				<div class="flex gap-4">
					<Select
						labelText="Rule type"
						name="type"
						class="flex-1"
					>
						{#each ruleTypeOptions as option (option.id)}
							<SelectItem
								value={option.id}
								text={option.text}
							/>
						{/each}
					</Select>
					<TextInput
						id="rule-value"
						name="value"
						labelText="Value"
						required
						class="flex-1"
					/>
				</div>
				<div class="mt-4">
					<Button kind="ghost" size="small" type="submit" icon={Add}>
						Create rule
					</Button>
				</div>
			</form>
		</div>

		{#if data.authRules?.length}
			<div class="grid gap-4">
				{#each data.authRules as rule (rule.id)}
					<Tile>
						<div
							class="flex flex-wrap items-center justify-between gap-4"
						>
							<div>
								<div class="font-semibold">
									{
										rule.type
											.replace(
												'_',
												' ',
											)
									}
								</div>
								<div class="text-sm">
									{
										rule
											.value
									}
								</div>
							</div>
							<form
								method="POST"
								action="?/deleteAuthRule"
								use:enhance
							>
								<input
									type="hidden"
									name="ruleId"
									value={rule.id}
								/>
								<Button
									kind="ghost"
									type="submit"
									icon={TrashCan}
									iconDescription="Delete"
									tooltipAlignment="end"
								/>
							</form>
						</div>
					</Tile>
				{/each}
			</div>
		{:else}
			<p>No authorization rules yet.</p>
		{/if}
	</div>

	<div class="space-y-4">
		<h2>Danger zone</h2>
		<form method="POST" action="?/deleteSink" use:enhance>
			<Button
				kind="danger"
				type="submit"
				icon={TrashCan}
				onclick={onDeleteClick}
			>
				Delete sink
			</Button>
		</form>
	</div>
</div>
