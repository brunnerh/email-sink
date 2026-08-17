<script>
	import PageTitle from '$lib/components/page-title.svelte';
	import { InlineNotification } from 'carbon-components-svelte';
</script>

<div class="h-full flex items-center justify-center p-6">
	<div class="w-full max-w-md space-y-6">
		<PageTitle title="Sign-in confirmed" />
		<InlineNotification
			kind="success"
			title="Sign-in confirmed"
			subtitle="Return to the device where you requested access."
			hideCloseButton
			statusIconDescription=""
		/>
	</div>
</div>

<style>
	:global(#main-content) {
		height: calc(100dvh - 3rem);
	}
</style>
