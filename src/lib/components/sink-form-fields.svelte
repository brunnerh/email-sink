<script>
	import {
		Checkbox,
		InlineNotification,
		TextInput,
		TooltipIcon,
	} from 'carbon-components-svelte';
	import { Information } from 'carbon-icons-svelte';

	let {
		name = '',
		slug = '',
		showSlugWarning = false,
		isAuthEnabled = false,
	} = $props();
</script>

<div class="space-y-4">
	<TextInput
		id="sink-name"
		name="name"
		labelText="Name"
		value={name}
		required
	/>

	{#if showSlugWarning}
		<InlineNotification
			kind="warning"
			title="Changing the slug will change the sink endpoints."
			hideCloseButton
			lowContrast
			statusIconDescription=""
		/>
	{/if}

	<TextInput
		id="sink-slug"
		name="slug"
		labelText="Slug"
		value={slug}
		required
	/>

	<div class="flex gap-8">
		<Checkbox
			class="flex-none"
			id="sink-auth-enabled"
			name="isAuthEnabled"
			value="on"
			labelText="Auth enabled"
			checked={isAuthEnabled}
		/>

		<TooltipIcon
			icon={Information}
			tooltipText={'When disabled, no API key is required to send data to the sink. ' +
				'Access to the sink contents is configured separately.'}
		/>
	</div>
</div>
