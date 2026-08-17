<script>
	import { enhance } from '$app/forms';
	import PageTitle from '$lib/components/page-title.svelte';
	import { Button, InlineNotification } from 'carbon-components-svelte';
    import { Checkmark } from 'carbon-icons-svelte';

	let { data } = $props();
</script>

<div class="h-full flex items-center justify-center p-6">
	<div class="w-full max-w-md space-y-6">
		<div class="space-y-2">
			<PageTitle title="Confirm sign-in" />
		</div>

		<InlineNotification
			kind="warning"
			title="Sign-in on other device"
			subtitle="Only confirm sign-in if you requested it."
			hideCloseButton
			statusIconDescription=""
			lowContrast
		/>

		<form method="POST" use:enhance>
			<input type="hidden" name="key" value={data.key} />
			<Button type="submit" icon={Checkmark}>Confirm sign-in</Button>
		</form>
	</div>
</div>

<style>
	:global(#main-content) {
		height: calc(100dvh - 3rem);
	}
</style>
