<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { resolve } from '$app/paths';
	import PageTitle from '$lib/components/page-title.svelte';
	import type { LoginStatusUpdate } from '$lib/shared/login-status-update.js';
	import type { SubmitFunction } from '@sveltejs/kit';
	import {
		Button,
		InlineNotification,
		TextInput,
	} from 'carbon-components-svelte';
	import { Login } from 'carbon-icons-svelte';

	let { form } = $props();
	let eventSource: EventSource | null = null;

	$effect(() => {
		return () => stopLoginEvents();
	});

	const onSubmit: SubmitFunction =
		() => async ({ result, update }) => {
			await update();
			if (result.type === 'success')
				startLoginEvents();
		};

	function startLoginEvents() {
		if (eventSource)
			return;

		const source = new EventSource(resolve('/login/events'));

		source.addEventListener('status-update', (event) => {
			const payload: LoginStatusUpdate = JSON.parse(event.data);

			if (payload.status === 'success') {
				invalidateAll();
				stopLoginEvents();
			}

			if (payload.status === 'timeout')
				stopLoginEvents();
		});

		source.addEventListener('error', () => {
			if (source.readyState === EventSource.CLOSED)
				stopLoginEvents();
		});

		eventSource = source;
	}

	function stopLoginEvents() {
		eventSource?.close();
		eventSource = null;
	}
</script>

<div class="h-full flex items-center justify-center p-6">
	<div class="w-full max-w-md space-y-6">
		<div class="space-y-2">
			<PageTitle title="Sign in" />
			<p>Use your email to access your account.</p>
		</div>

		<form method="POST" class="space-y-4" use:enhance={onSubmit}>
			<TextInput
				id="login-email"
				name="email"
				type="email"
				labelText="Email"
				placeholder="name@company.com"
				required
			/>

			{#if form?.success}
				<InlineNotification
					kind="success"
					title="Check your inbox"
					subtitle="We sent a sign-in link to your email."
					hideCloseButton
				/>
			{:else if form?.error}
				<InlineNotification
					kind="error"
					title="Login failed"
					subtitle={form.error}
					hideCloseButton
				/>
			{/if}

			<div class="w-full">
				<Button type="submit" icon={Login}>
					Sign in
				</Button>
			</div>
		</form>
	</div>
</div>

<style>
	:global(#main-content) {
		height: calc(100dvh - 3rem);
	}
</style>
