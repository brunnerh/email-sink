<script>
	import PageTitle from '$lib/components/page-title.svelte';
	import { InlineNotification } from 'carbon-components-svelte';
</script>

<PageTitle title="Logged in" />

<InlineNotification
	kind="success"
	title="You are now logged in!"
	subtitle="You can close this page and return to the app."
	hideCloseButton
	statusIconDescription=""
/>
