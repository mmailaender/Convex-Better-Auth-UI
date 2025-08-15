<script lang="ts">
	// Svelte
	import { page } from '$app/state';
	import { onMount } from 'svelte';
	import { pushState, replaceState } from '$app/navigation';

	/** UI **/
	// Primitives
	import * as Tabs from '$lib/primitives/ui/tabs';
	// Icons
	import { Bolt, ChevronLeft, ChevronRight, UserIcon, Wallet } from '@lucide/svelte';
	// Widgets
	import OrganizationInfo from '$lib/organizations/ui/OrganizationInfo.svelte';
	import DeleteOrganization from '$lib/organizations/ui/DeleteOrganization.svelte';
	import MembersAndInvitations from '$lib/organizations/ui/MembersAndInvitations.svelte';
	import LeaveOrganization from '$lib/organizations/ui/LeaveOrganization.svelte';

	// API
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	import { api } from '$convex/_generated/api';
	const roles = useRoles();
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// API Types
	import type { FunctionReturnType } from 'convex/server';

	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type InvitationListResponse = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;

	// Types
	type OrganizationProfileProps = {
		/**
		 * Whether the dialog is open. Used to reset internal state on close.
		 */
		open?: boolean;
		/**
		 * Optional callback that will be called when an organization is successfully deleted
		 */
		onSuccessfulDelete?: (() => void) | undefined;
		/**
		 * Optional initial data to pass to child components for faster initialization
		 */
		initialData?: {
			// For OrganizationInfo component
			user?: UserResponse;
			activeOrganization?: ActiveOrganizationResponse;
			// For MembersAndInvitations component
			invitationList?: InvitationListResponse;
			// For LeaveOrganization component
			activeUser?: UserResponse;
		};
	};

	const { open = false, onSuccessfulDelete, initialData }: OrganizationProfileProps = $props();

	// State
	let activeMobileTab: string = $state('');
	let activeDesktopTab: string = $state('general');
	// Guard to only initialize desktop tab from URL on open
	let initializedDesktopFromUrl: boolean = $state(false);
	// Suppress mobile transitions when coming from browser back/forward (iOS swipe)
	let suppressMobileTransition: boolean = $state(false);
	let popstateTimer: ReturnType<typeof setTimeout> | null = null;

	// Reset internal tab state when dialog closes so reopen shows the list by default
	$effect(() => {
		if (!open) {
			initializedDesktopFromUrl = false;
			activeMobileTab = '';
		}
	});

	onMount(() => {
		const onPopState = () => {
			suppressMobileTransition = true;
			// Immediately sync mobile tab from current URL so UI matches history entry
			const params = new URLSearchParams(window.location.search);
			const tabParam = params.get('tab') ?? '';
			const allowed = new Set(visibleTabs.map((t) => t.value));
			activeMobileTab = tabParam && allowed.has(tabParam) ? tabParam : '';
			if (popstateTimer) clearTimeout(popstateTimer);
			popstateTimer = setTimeout(() => {
				suppressMobileTransition = false;
				popstateTimer = null;
			}, 400);
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});

	// Tab configuration
	const tabs = [
		{
			value: 'general',
			label: 'General',
			icon: Bolt,
			showForAllUsers: true
		},
		{
			value: 'members',
			label: 'Members',
			icon: UserIcon,
			showForAllUsers: false
		},
		{
			value: 'billing',
			label: 'Billing',
			icon: Wallet,
			showForAllUsers: false
		}
	];

	const visibleTabs = $derived(tabs.filter((tab) => tab.showForAllUsers || isOwnerOrAdmin));

	function handleMobileTabChange(value: string) {
		// Slight delay to allow tab state to update before showing content
		setTimeout(() => (activeMobileTab = value), 10);
		// Push shallow route via history so iOS doesn't trigger a full navigation
		const url = new URL(window.location.href);
		url.searchParams.set('tab', value);
		// Ensure dialog stays present in the URL and state while navigating tabs inside the dialog
		url.searchParams.set('dialog', 'organization-profile');
		pushState(`${url.pathname}${url.search}${url.hash}`, { dialog: 'organization-profile' });
	}

	function closeMobileTab() {
		// Remove tab param to return to list view within dialog (no navigation)
		const url = new URL(window.location.href);
		if (url.searchParams.has('tab')) {
			url.searchParams.delete('tab');
			// Keep dialog open in URL/state
			url.searchParams.set('dialog', 'organization-profile');
			replaceState(`${url.pathname}${url.search}${url.hash}`, { dialog: 'organization-profile' });
		}
		activeMobileTab = '';
	}

	// Sync tabs with URL params
	$effect(() => {
		// Anchor to SvelteKit navigations, but read from window for instant shallow history updates
		const _ = page.url;
		const sp = new URLSearchParams(window.location.search);
		const dialogOpen = sp.get('dialog') === 'organization-profile';
		const tabParam = sp.get('tab') ?? '';
		const allowed = new Set(visibleTabs.map((t) => t.value));
		const normalized = tabParam && allowed.has(tabParam) ? tabParam : 'general';

		if (dialogOpen) {
			// Initialize desktop selection once from URL when dialog is open
			if (!initializedDesktopFromUrl) {
				activeDesktopTab = normalized;
				initializedDesktopFromUrl = true;
			}
			// Mobile overlay uses empty => list, value => content
			activeMobileTab = tabParam && allowed.has(tabParam) ? tabParam : '';
		} else {
			// Reset guards when dialog closes
			initializedDesktopFromUrl = false;
			activeMobileTab = '';
		}
	});
</script>

<Tabs.Root
	bind:value={activeDesktopTab}
	orientation="vertical"
	class="relative h-full overflow-hidden"
>
	<!-- Desktop Layout -->
	<div class="hidden h-full w-full md:flex">
		<!-- Desktop Navigation -->
		<div class="bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-56 p-2">
			<div class="px-3 py-4 text-xl font-medium">Organization</div>
			<Tabs.List class="flex flex-col">
				{#each visibleTabs as tab (tab.value)}
					<Tabs.Trigger value={tab.value} class="gap-2 pl-2">
						<div class="flex h-6 w-6 shrink-0 items-center justify-center">
							<tab.icon />
						</div>
						<span class="w-full">{tab.label}</span>
					</Tabs.Trigger>
				{/each}
			</Tabs.List>
		</div>

		<!-- Desktop Content -->
		<div class="flex-1">
			<Tabs.Content value="general" class="flex h-full flex-col">
				<div class="h-full">
					<h6
						class="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-left text-sm font-medium"
					>
						General settings
					</h6>
					<OrganizationInfo
						initialData={initialData
							? {
									user: initialData.user,
									activeOrganization: initialData.activeOrganization
								}
							: undefined}
					/>
				</div>
				<div class="pt-16">
					<LeaveOrganization
						initialData={{
							activeUser: initialData?.activeUser,
							activeOrganization: initialData?.activeOrganization
						}}
					/>
					<DeleteOrganization {onSuccessfulDelete} />
				</div>
			</Tabs.Content>

			{#if isOwnerOrAdmin}
				<Tabs.Content value="members">
					<h6
						class="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-left text-sm font-medium"
					>
						Members
					</h6>
					<MembersAndInvitations
						initialData={{
							activeOrganization: initialData?.activeOrganization,
							invitationList: initialData?.invitationList
						}}
					/>
				</Tabs.Content>
				<Tabs.Content value="billing">
					<h6
						class="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-left text-sm font-medium"
					>
						Billing
					</h6>
				</Tabs.Content>
			{/if}
		</div>
	</div>

	<!-- Mobile Layout -->
	<div class="relative h-full w-full md:hidden">
		<!-- Mobile Navigation -->
		<div
			class="bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-full transform p-2 {suppressMobileTransition
				? ''
				: 'transition-transform duration-300'} {activeMobileTab
				? '-translate-x-full'
				: 'translate-x-0'}"
		>
			<div class="px-3 py-4 text-2xl font-medium">Organization</div>
			<Tabs.List class="flex w-full flex-col pt-8">
				{#each visibleTabs as tab, index (tab.value)}
					<Tabs.Trigger
						value={tab.value}
						onclick={() => handleMobileTabChange(tab.value)}
						class="w-full gap-3 aria-selected:bg-transparent aria-selected:text-inherit"
					>
						<div
							class="bg-surface-300-700 rounded-base flex h-7 w-7 shrink-0 items-center justify-center"
						>
							<tab.icon />
						</div>
						<span class="w-full">{tab.label}</span>
						<ChevronRight class="flex" />
					</Tabs.Trigger>
					{#if index < visibleTabs.length - 1}
						<div class="flex h-2 w-full items-center justify-center px-3">
							<hr class="border-0.5 border-surface-200-800 w-full" />
						</div>
					{/if}
				{/each}
			</Tabs.List>
		</div>

		<!-- Mobile Content -->
		{#if activeMobileTab}
			<div
				class="bg-surface-100-900 absolute inset-0 flex translate-x-0 transform flex-col gap-4 px-4 py-6 {suppressMobileTransition
					? ''
					: 'transition-transform duration-300'}"
			>
				<button
					class="ring-offset-background focus:ring-ring hover:bg-surface-300-700 rounded-base absolute top-5 left-4 p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
					onclick={closeMobileTab}
				>
					<ChevronLeft />
				</button>

				{#if activeMobileTab === 'general'}
					<div class="h-full">
						<h6
							class="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-center text-sm font-medium"
						>
							General settings
						</h6>
						<OrganizationInfo
							initialData={{
								user: initialData?.user,
								activeOrganization: initialData?.activeOrganization
							}}
						/>
					</div>
					<DeleteOrganization {onSuccessfulDelete} />
					<LeaveOrganization
						initialData={{
							activeUser: initialData?.activeUser,
							activeOrganization: initialData?.activeOrganization
						}}
					/>
				{:else if activeMobileTab === 'members'}
					<h6
						class="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-center text-sm font-medium"
					>
						Members
					</h6>
					<MembersAndInvitations
						initialData={{
							activeOrganization: initialData?.activeOrganization,
							invitationList: initialData?.invitationList
						}}
					/>
				{:else if activeMobileTab === 'billing'}
					<h6
						class="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-center text-sm font-medium"
					>
						Billing
					</h6>
				{/if}
			</div>
		{/if}
	</div>
</Tabs.Root>
