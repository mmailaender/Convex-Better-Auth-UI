<script lang="ts">
	// Svelte
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	// Primitives
	import * as Popover from '$lib/primitives/ui/popover';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	// Icons
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SettingsIcon from '@lucide/svelte/icons/settings';
	// Components
	import CreateOrganization from '$lib/organizations/ui/CreateOrganization.svelte';

	import LeaveOrganization from '$lib/organizations/ui/LeaveOrganization.svelte';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	// Constants
	import { DIALOG_KEY } from '$lib/organizations/utils/organization.constants';

	// Types
	import type { authClient } from '$lib/auth/api/auth-client';
	import type { PopoverRootProps } from '@ark-ui/svelte';
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type ListOrganizationsType = FunctionReturnType<
		typeof api.organizations.queries.listOrganizations
	>;
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListInvitationType = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;
	type Role = typeof authClient.$Infer.Member.role;

	// Constants
	import { AUTH_CONSTANTS } from '../../../convex/auth.constants';

	// Props
	const {
		popoverPlacement = 'bottom-end',
		initialData
	}: {
		/** Placement of the popover relative to the trigger */
		popoverPlacement?: NonNullable<PopoverRootProps['positioning']>['placement'];
		initialData?: {
			activeUser?: GetActiveUserType;
			organizationList?: ListOrganizationsType;
			activeOrganization?: GetActiveOrganizationType;
			invitationList?: ListInvitationType;
			role?: Role;
		};
	} = $props();

	if (!AUTH_CONSTANTS.organizations) {
		console.error(
			'Organizations are disabled, but OrganizationSwitcher is being used. Please turn them on in auth.constants.ts'
		);
	}

	// Auth
	const auth = useAuth();
	const isLoading = $derived(auth.isLoading);
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries - backend handles authentication, initialData prevents empty state during auth sync
	const organizationListResponse = useQuery(
		api.organizations.queries.listOrganizations,
		() => (auth.isAuthenticated ? {} : 'skip'),
		{
			initialData: initialData?.organizationList
		}
	);
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		() => (auth.isAuthenticated ? {} : 'skip'),
		{
			initialData: initialData?.activeOrganization
		}
	);
	// Derived state - fallback to initialData during auth sync
	const organizationList = $derived(
		organizationListResponse?.data ?? initialData?.organizationList
	);
	const activeOrganization = $derived(
		activeOrganizationResponse?.data ?? initialData?.activeOrganization
	);
	const roles = useRoles({ initialData: initialData?.role });
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// Component state
	let switcherPopoverOpen: boolean = $state(false);
	let createOrganizationDialogOpen: boolean = $state(false);

	// iOS back-swipe handling
	let isIOS: boolean = $state(false);

	// Back-swipe guard
	let guardTimer: ReturnType<typeof setTimeout> | null = null;
	let prevShouldBeOpen = false;

	// Handler functions

	function closeCreateOrganization(): void {
		createOrganizationDialogOpen = false;
	}
	function openCreateOrgModal(): void {
		createOrganizationDialogOpen = true;
		switcherPopoverOpen = false;
	}

	// 3: Open via button — push history entry + open immediately for snappy UX
	function openProfileModal() {
		switcherPopoverOpen = false;
		const url = new URL(page.url);
		if (url.searchParams.get('dialog') !== DIALOG_KEY) {
			url.searchParams.set('dialog', DIALOG_KEY);
			goto(`${url.pathname}${url.search}${url.hash}`, {
				replaceState: false,
				noScroll: true,
				keepFocus: true
			});
		}
	}

	// iOS Safari back-swipe guard only: do not mutate state here, only arm guard
	onMount(() => {
		// Detect iOS/iPadOS (including iPadOS 13+ which reports as Macintosh)
		const ua = navigator.userAgent;
		isIOS =
			/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);

		const initialSlug = activeOrganization?.slug ?? initialData?.activeOrganization?.slug;
		if (initialSlug) {
			const pathname = page.url.pathname;
			if (/(?:^|\/)\b(active-organization|active-org)\b(?=\/|$)/.test(pathname)) {
				const newPathname = pathname.replace(
					/\/(active-organization|active-org)(?=\/|$)/g,
					`/${initialSlug}`
				);
				goto(`${newPathname}${page.url.search}${page.url.hash}`, {
					replaceState: true,
					noScroll: true,
					keepFocus: true
				});
			}
		}

		const onPopState = () => {
			if (!isIOS) return;
			// Only arm guard when the dialog is actually closing via history (not when switching tabs)
			const url = new URL(window.location.href);
			const shouldBeOpen = url.searchParams.get('dialog') === DIALOG_KEY;
			const closingCandidate = prevShouldBeOpen && !shouldBeOpen;
			if (closingCandidate) {
				if (guardTimer) clearTimeout(guardTimer);
				guardTimer = setTimeout(() => {
					guardTimer = null;
				}, 650);
			}
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
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
		if (organizationList && organizationList.length > 0 && !activeOrganization) {
			updateActiveOrg();
		}
	});
</script>

{#if !AUTH_CONSTANTS.organizations}
	<!-- Gate 1: Organizations feature is disabled -->
	<div class="text-error-600-400">
		Organizations are disabled, but OrganizationSwitcher is being used. Please turn them on in
		auth.constants.ts
	</div>
{:else if !isAuthenticated && !initialData?.organizationList && !initialData?.activeOrganization}
	<!-- Gate 2: Not authenticated and no SSR data - don't show anything -->
	<!-- Return null by not rendering anything -->
{:else if (isLoading || (organizationListResponse?.isLoading ?? false) || (activeOrganizationResponse?.isLoading ?? false)) && !organizationList && !activeOrganization}
	<!-- Gate 3: Loading state - only show if queries are loading AND no data is available yet -->
	<div class="placeholder h-8 w-40 animate-pulse"></div>
{:else if organizationList && organizationList.length === 0}
	<!-- Gate 4: No organizations - show create organization modal -->
	<Dialog.Root bind:open={createOrganizationDialogOpen}>
		<Dialog.Trigger class="btn preset-tonal flex items-center gap-2">
			<PlusIcon class="size-4" />
			<span>Create Organization</span>
		</Dialog.Trigger>
		<Dialog.Content class="max-w-md">
			<CreateOrganization onSuccessfulCreate={closeCreateOrganization} />
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{:else if organizationList}
	<!-- Gate 5: Has organizations - show the switcher -->
	<Popover.Root bind:open={switcherPopoverOpen} positioning={{ placement: popoverPlacement }}>
		<Popover.Trigger
			class=" border-surface-200-800 rounded-container flex w-40 flex-row items-center justify-between border p-1 pr-2 duration-200 ease-in-out"
		>
			<div class="flex w-full max-w-64 items-center gap-3 overflow-hidden">
				<Avatar.Root class="rounded-container size-8 shrink-0">
					<Avatar.Image src={activeOrganization?.logo} alt={activeOrganization?.name} />
					<Avatar.Fallback>
						<Building2Icon class="size-5" />
					</Avatar.Fallback>
				</Avatar.Root>
				<span class="text-surface-700-300 truncate text-sm">
					{activeOrganization?.name}
				</span>
			</div>
			<ChevronsUpDownIcon class="size-4 opacity-40" />
		</Popover.Trigger>
		<Popover.Content>
			<div class="flex flex-col gap-1">
				<div role="list" class="bg-surface-50-950 rounded-container flex flex-col overflow-hidden">
					{#if isOwnerOrAdmin}
						<button
							onclick={openProfileModal}
							class="btn hover:bg-surface-100-900/50 text-surface-700-300 flex h-14 w-full max-w-80 items-center gap-3 p-3 pr-5 text-left text-sm/6"
						>
							<Avatar.Root class="rounded-container size-8 shrink-0">
								<Avatar.Image src={activeOrganization?.logo} alt={activeOrganization?.name} />
								<Avatar.Fallback>
									<Building2Icon class="size-4" />
								</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-surface-700-300 text-medium w-full truncate text-sm">
								{activeOrganization?.name}
							</span>
							<SettingsIcon class="size-6" />
						</button>
					{:else}
						<div
							class="text-surface-700-300 border-surface-200-800 flex max-w-80 items-center gap-3 border-t p-3 text-sm/6"
						>
							<Avatar.Root class="rounded-container size-8 shrink-0">
								<Avatar.Image src={activeOrganization?.logo} alt={activeOrganization?.name} />
								<Avatar.Fallback>
									<Building2Icon class="size-4" />
								</Avatar.Fallback>
							</Avatar.Root>
							<span class="text-surface-700-300 text-medium w-full truncate">
								{activeOrganization?.name}
							</span>
							<LeaveOrganization />
						</div>
					{/if}

					{#each organizationList.filter((org) => org && org.id !== activeOrganization?.id) as org (org?.id)}
						<div>
							<button
								onclick={() => updateActiveOrg(org.id)}
								class="group hover:bg-surface-100-900/50 border-surface-200-800 flex w-full max-w-80 items-center gap-3 border-t p-3"
							>
								<Avatar.Root class="rounded-container size-8 shrink-0">
									<Avatar.Image src={org.logo} alt={org.name} />
									<Avatar.Fallback>
										<Building2Icon class="size-4" />
									</Avatar.Fallback>
								</Avatar.Root>
								<span class="text-surface-700-300 truncate text-sm">
									{org.name}
								</span>
							</button>
						</div>
					{/each}
				</div>
				<button
					onclick={openCreateOrgModal}
					class="btn hover:bg-surface-50-950/50 flex h-12 w-full items-center justify-start gap-3 bg-transparent p-3"
				>
					<div
						class="bg-surface-200-800 border-surface-300-700 rounded-base flex size-8 shrink-0 items-center justify-center border border-dashed"
					>
						<PlusIcon class="size-4" />
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
{/if}
