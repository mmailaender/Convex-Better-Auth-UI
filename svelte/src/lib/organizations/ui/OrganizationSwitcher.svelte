<script lang="ts">
	// Svelte
	import { onMount } from 'svelte';
	import { goto, pushState, replaceState } from '$app/navigation';
	import { page } from '$app/state';

	// Primitives
	import * as Popover from '$lib/primitives/ui/popover';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	// Icons
	import { Building2, ChevronsUpDown, Plus, Settings, X } from '@lucide/svelte';
	// Components
	import CreateOrganization from '$lib/organizations/ui/CreateOrganization.svelte';
	import OrganizationProfile from '$lib/organizations/ui/OrganizationProfile.svelte';
	import LeaveOrganization from '$lib/organizations/ui/LeaveOrganization.svelte';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	// Types
	import type { PopoverRootProps } from '@ark-ui/svelte';
	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type ListOrganizationsResponse = FunctionReturnType<
		typeof api.organizations.queries.listOrganizations
	>;

	// Constants
	import { AUTH_CONSTANTS } from '$convex/auth.constants';

	// Props
	const {
		popoverPlacement = 'bottom-end',
		initialData
	}: {
		/** Placement of the popover relative to the trigger */
		popoverPlacement?: NonNullable<PopoverRootProps['positioning']>['placement'];
		initialData?: {
			listOrganizations: ListOrganizationsResponse;
			activeOrganization: ActiveOrganizationResponse;
		};
	} = $props();

	if (!AUTH_CONSTANTS.organizations) {
		console.error('Organizations are disabled. Please turn them on in auth.constants.ts');
	}

	// Auth state
	const auth = useAuth();
	const isLoading = $derived(auth.isLoading);
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries
	const organizationsResponse = useQuery(
		api.organizations.queries.listOrganizations,
		{},
		{ initialData: initialData?.listOrganizations }
	);
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);
	// Derived state
	const organizations = $derived(organizationsResponse.data);
	const activeOrganization = $derived(activeOrganizationResponse.data);
	const roles = useRoles();
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// Component state
	let switcherPopoverOpen: boolean = $state(false);
	let createOrganizationDialogOpen: boolean = $state(false);
	let organizationProfileDialogOpen: boolean = $state(false);
	// Track lifecycle and previous open state for organization profile dialog
	let mounted = $state(false);
	let prevOrganizationProfileDialogOpen = $state(false);
	// Suppress dialog transitions around popstate (iOS swipe)
	let suppressDialogTransition: boolean = $state(false);
	// Ignore $page.url-driven sync while we handle a native popstate to avoid racey reopen
	let handlingPopState: boolean = $state(false);
	let popstateTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		mounted = true;
		const onPopState = (e: PopStateEvent) => {
			suppressDialogTransition = true;
			handlingPopState = true;
			// Prefer state-based detection to avoid timing glitches on iOS Safari
			const st: any = e.state;
			if (st && typeof st === 'object' && 'dialog' in st) {
				organizationProfileDialogOpen = st.dialog === 'organization-profile';
			} else {
				// Fallback: on iOS the URL can lag during swipe. Avoid proactive close and set
				// the immediate state from the current URL so the dialog doesn't blink closed
				// when navigating back from a tab to the dialog list. We'll confirm after two RAFs.
				const immediateHas =
					new URLSearchParams(window.location.search).get('dialog') === 'organization-profile';
				organizationProfileDialogOpen = immediateHas;
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						const has =
							new URLSearchParams(window.location.search).get('dialog') ===
							'organization-profile';
						organizationProfileDialogOpen = has;
						// Keep handlingPopState true; the timeout will clear it after the swipe settles
					});
				});
			}
			if (popstateTimer) clearTimeout(popstateTimer);
			popstateTimer = setTimeout(() => {
				suppressDialogTransition = false;
				popstateTimer = null;
				// in case state path was taken (no RAF), clear the flag here
				handlingPopState = false;
			}, 400);
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});

	// Handler functions

	function closeCreateOrganization(): void {
		createOrganizationDialogOpen = false;
	}
	function openCreateOrgModal(): void {
		createOrganizationDialogOpen = true;
		switcherPopoverOpen = false;
	}

	function closeOrganizationProfile(): void {
		organizationProfileDialogOpen = false;
	}
	function openProfileModal(): void {
		switcherPopoverOpen = false;
		const has =
			new URLSearchParams(window.location.search).get('dialog') === 'organization-profile';
		if (!has) {
			const url = new URL(window.location.href);
			url.searchParams.set('dialog', 'organization-profile');
			const path = `${url.pathname}${url.search}${url.hash}`;
			pushState(path, { dialog: 'organization-profile' });
		}
		// Open immediately; URL param is updated via History API above.
		organizationProfileDialogOpen = true;
	}

	$effect(() => {
		const has =
			new URLSearchParams(window.location.search).get('dialog') === 'organization-profile';
		// During native popstate, avoid mutating history; just record previous state and exit.
		if (handlingPopState) {
			prevOrganizationProfileDialogOpen = organizationProfileDialogOpen;
			return;
		}
		if (mounted && prevOrganizationProfileDialogOpen && !organizationProfileDialogOpen) {
			const url = new URL(window.location.href);
			url.searchParams.delete('dialog');
			// Also remove any tab selection to keep URL clean when dialog closes
			url.searchParams.delete('tab');
			const path = `${url.pathname}${url.search}${url.hash}`;
			replaceState(path, {});
		}
		prevOrganizationProfileDialogOpen = organizationProfileDialogOpen;
	});

	$effect(() => {
		// Use $page.url as a reactive dependency, but compute from window to avoid router animation timing on iOS
		const _ = page.url;
		if (handlingPopState) return;
		let has = false;
		const st: any = history.state;
		if (st && typeof st === 'object' && 'dialog' in st) {
			has = st.dialog === 'organization-profile';
		} else {
			has =
				new URLSearchParams(window.location.search).get('dialog') === 'organization-profile';
		}
		if (has !== organizationProfileDialogOpen) {
			organizationProfileDialogOpen = has;
		}
	});

	/**
	 * Updates the active organization and replaces URL slug if needed
	 */
	async function updateActiveOrg(organizationId?: string): Promise<void> {
		try {
			// Get current active organization slug before mutation
			const currentActiveOrgSlug = activeOrganization?.slug;
			const currentPathname = page.url.pathname;

			// Check if current URL contains the active organization slug
			const urlContainsCurrentSlug =
				currentActiveOrgSlug &&
				(currentPathname.includes(`/${currentActiveOrgSlug}/`) ||
					currentPathname.includes(`/${currentActiveOrgSlug}`));

			// Execute the mutation to set new active organization
			await client.mutation(api.organizations.mutations.setActiveOrganization, { organizationId });

			// Get the new active organization data
			const newActiveOrgSlug = activeOrganization?.slug;

			// If URL contained old slug and we have a new slug, replace it
			if (
				urlContainsCurrentSlug &&
				currentActiveOrgSlug &&
				newActiveOrgSlug &&
				currentActiveOrgSlug !== newActiveOrgSlug
			) {
				// Replace the old slug with the new slug in the URL
				const newPathname = currentPathname.replace(
					new RegExp(`/${currentActiveOrgSlug}(?=/|$)`, 'g'),
					`/${newActiveOrgSlug}`
				);

				// Navigate to the new URL
				await goto(newPathname, { replaceState: true });
			} else {
				// No slug replacement needed, just refresh current page
				await goto(page.url.pathname + page.url.search, { replaceState: true });
			}

			// Close popover
			switcherPopoverOpen = false;
		} catch (err) {
			console.error('Error updating active organization:', err);
		}
	}

	// Check on mount if there is an active organization and if not, use the first organization from listOrganizations and call setActiveOrg (We use effect instead of useMount as organizations and activeOrganization are loaded async)
	$effect(() => {
		if (organizations && organizations.length > 0 && !activeOrganization) {
			updateActiveOrg();
		}
	});
</script>

<!-- Not authenticated or organizations disabled - don't show anything -->
{#if !isAuthenticated || !AUTH_CONSTANTS.organizations}
	<!-- Return null by not rendering anything -->

	<!-- Loading state -->
{:else if isLoading || !organizations || organizationsResponse.isLoading}
	<div class="placeholder h-8 w-40 animate-pulse"></div>

	<!-- No organizations - show create organization modal -->
{:else if organizations.length === 0}
	<Dialog.Root bind:open={createOrganizationDialogOpen}>
		<Dialog.Trigger class="btn preset-tonal flex items-center gap-2">
			<Plus class="size-4" />
			<span>Create Organization</span>
		</Dialog.Trigger>
		<Dialog.Content class="max-w-md">
			<CreateOrganization onSuccessfulCreate={closeCreateOrganization} />
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>

	<!-- Has organizations - show the switcher -->
{:else}
	<Popover.Root bind:open={switcherPopoverOpen} positioning={{ placement: popoverPlacement }}>
		<Popover.Trigger
			class="hover:bg-surface-200-800 border-surface-200-800 rounded-container flex w-40 flex-row items-center justify-between border p-1 pr-2 duration-200 ease-in-out"
		>
			<div class="flex w-full max-w-64 items-center gap-3 overflow-hidden">
				<Avatar.Root class="rounded-container size-8 shrink-0">
					<Avatar.Image src={activeOrganization?.logo} alt={activeOrganization?.name} />
					<Avatar.Fallback>
						<Building2 class="size-5" />
					</Avatar.Fallback>
				</Avatar.Root>
				<span class="text-surface-700-300 truncate text-sm">
					{activeOrganization?.name}
				</span>
			</div>
			<ChevronsUpDown class="size-4 opacity-40" />
		</Popover.Trigger>
		<Popover.Content>
			<div class="flex flex-col gap-1">
				<div role="list" class="bg-surface-50-950 rounded-container flex flex-col">
					{#if isOwnerOrAdmin}
						<button
							onclick={openProfileModal}
							class="btn text-surface-700-300 border-surface-200-800 flex w-full max-w-80 items-center gap-3 border-b p-3 text-left text-sm/6"
						>
							<Avatar.Root class="rounded-container size-8 shrink-0">
								<Avatar.Image src={activeOrganization?.logo} alt={activeOrganization?.name} />
								<Avatar.Fallback>
									<Building2 class="size-5" />
								</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-surface-700-300 text-medium w-full truncate text-base">
								{activeOrganization?.name}
							</span>
							<Settings class="size-6" />
						</button>
					{:else}
						<div
							class="text-surface-700-300 border-surface-200-800 flex max-w-80 items-center gap-3 border-b p-3 text-sm/6"
						>
							<Avatar.Root class="rounded-container size-8 shrink-0">
								<Avatar.Image src={activeOrganization?.logo} alt={activeOrganization?.name} />
								<Avatar.Fallback>
									<Building2 class="size-5" />
								</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-surface-700-300 text-medium w-full truncate text-base">
								{activeOrganization?.name}
							</span>
							<LeaveOrganization />
						</div>
					{/if}

					{#each organizations.filter((org) => org && org.id !== activeOrganization?.id) as org (org?.id)}
						<div>
							<button
								onclick={() => updateActiveOrg(org.id)}
								class="group hover:bg-surface-100-900/50 flex w-full max-w-80 items-center gap-3 p-3"
							>
								<Avatar.Root class="rounded-container size-8 shrink-0">
									<Avatar.Image src={org.logo} alt={org.name} />
									<Avatar.Fallback>
										<Building2 class="size-5" />
									</Avatar.Fallback>
								</Avatar.Root>
								<span class="text-surface-700-300 truncate text-base">
									{org.name}
								</span>
							</button>
						</div>
					{/each}
				</div>
				<button
					onclick={openCreateOrgModal}
					class="btn hover:bg-surface-50-950/50 flex w-full items-center justify-start gap-3 bg-transparent p-3"
				>
					<div
						class="bg-surface-200-800 border-surface-300-700 rounded-base flex size-8 shrink-0 items-center justify-center border border-dashed"
					>
						<Plus class="size-4" />
					</div>
					<span class="text-surface-700-300 text-sm">Create Organization</span>
				</button>
			</div>
		</Popover.Content>
	</Popover.Root>

	<!-- Create Organization Modal -->
	<Dialog.Root bind:open={createOrganizationDialogOpen}>
		<Dialog.Content class="max-w-md">
			<Dialog.Header>
				<Dialog.Title>Create Organization</Dialog.Title>
			</Dialog.Header>
			<CreateOrganization onSuccessfulCreate={closeCreateOrganization} />
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>

	<!-- Organization Profile Modal -->
	<Dialog.Root bind:open={organizationProfileDialogOpen}>
		<Dialog.Content
			class={`md:rounded-container top-0 left-0 h-full max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-none p-0 md:top-[50%] md:left-[50%] md:h-[70vh] md:w-2xl md:translate-x-[-50%] md:translate-y-[-50%] lg:w-4xl ${suppressDialogTransition ? 'animate-none transition-none' : ''}`}
		>
			<Dialog.Header class="hidden">
				<Dialog.Title></Dialog.Title>
			</Dialog.Header>
			<div
				class="max-h-[100dvh] overflow-auto overscroll-contain"
				onfocusin={(e) =>
					(e.target as HTMLElement)?.scrollIntoView({
						behavior: 'smooth',
						block: 'center',
						inline: 'nearest'
					})}
			>
				<OrganizationProfile open={organizationProfileDialogOpen} onSuccessfulDelete={closeOrganizationProfile} />
			</div>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{/if}
