<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import './site.css';
	import './theme.css';

	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import {
		Column,
		Content,
		Grid,
		Header,
		HeaderAction,
		HeaderPanelDivider,
		HeaderPanelLink,
		HeaderPanelLinks,
		HeaderUtilities,
		Row,
		SideNav,
		SideNavItems,
		SideNavLink,
	} from 'carbon-components-svelte';
	import { UserAvatarFilled } from 'carbon-icons-svelte';
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';
	import HeaderPanelItem from './header-panel-item.svelte';
	import { browser } from '$app/environment';

	type LayoutProps = {
		data:
			& LayoutData
			& {
				isAdmin: boolean;
				isAuthRoute: boolean;
				sinks: Array<{ id: number; name: string }>;
				user?: { email: string } | null;
			};
		children: Snippet;
	};

	let { data, children }: LayoutProps = $props();
	let isSideNavOpen = $state(true);
	let openMenu: 'user' | null = $state(null);

	if (browser)
		$inspect(page.data);
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<Header
	platformName="Email Sink"
	href={resolve('/')}
	bind:isSideNavOpen
>
	{#snippet platform()}
		<div class="flex gap-2 items-center">
			<img src={favicon} alt="" class="w-[1.5em] h-[1.5em]" />
			Email Sink
		</div>
	{/snippet}
	{#if data.user}
		<HeaderUtilities>
			<HeaderAction
				icon={UserAvatarFilled}
				isOpen={openMenu === 'user'}
				iconDescription="User menu"
				tooltipAlignment="end"
				on:open={() => openMenu = 'user'}
				on:close={() => openMenu = null}
			>
				<HeaderPanelLinks>
					<HeaderPanelItem>{data.user.email}</HeaderPanelItem>
					<HeaderPanelDivider>Actions</HeaderPanelDivider>
					<HeaderPanelLink>
						<form
							action={resolve('/logout')}
							method="POST"
							style="margin: -0.375rem calc(-1 * var(--cds-spacing-05, 1rem)); display: grid; place-items: stretch"
						>
							<button
								style="all: unset; padding: 0.375rem var(--cds-spacing-05, 1rem)"
							>
								Log out
							</button>
						</form>
					</HeaderPanelLink>
				</HeaderPanelLinks>
			</HeaderAction>
		</HeaderUtilities>
	{/if}
</Header>

{#if data.user}
	<SideNav bind:isOpen={isSideNavOpen}>
		<SideNavItems>
			{#if data.isAdmin}
				<SideNavLink
					href={resolve('/sinks/new')}
					isSelected={page.url.pathname === resolve('/sinks/new')}
				>
					Add new sink
				</SideNavLink>
			{/if}

			{#each data.sinks as sink (sink.id)}
				<SideNavLink
					href={resolve(`/sinks/${sink.id}`)}
					isSelected={page.url.pathname.startsWith(
						resolve(`/sinks/${sink.id}`),
					)}
				>
					{sink.name}
				</SideNavLink>
			{/each}
		</SideNavItems>
	</SideNav>
{/if}

<Content>
	<Grid>
		<Row>
			<Column>
				{@render children()}
			</Column>
		</Row>
	</Grid>
</Content>

<style>
	:global {
		.bx--content {
			padding: 0;
			padding-top: 1em;
			padding-bottom: 3rem;

			@media (min-width: 42rem) {
				padding-top: 2rem;
			}
		}
	}
</style>
