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
		console.error(
			'Organizations are disabled, but OrganizationSwitcher is being used. Please turn them on in auth.constants.ts'
		);
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

	// iOS back-swipe handling
	let isIOS: boolean = $state(false);
	let suppressDialogTransition: boolean = $state(false);

	// Back-swipe guard
	let backSwipeGuard: boolean = $state(false);
	let guardTimer: ReturnType<typeof setTimeout> | null = null;
	let prevShouldBeOpen = false;
	let suppressDialogRender: boolean = $state(false);
	let internalCloseGuard: boolean = $state(false);
	let internalCloseTimer: ReturnType<typeof setTimeout> | null = null;

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

	const DIALOG_KEY = 'organization-profile';

	// 1 + 2: Keep dialog state in sync with the URL only.
	// During iOS interactive back, block a brief re-open only when closing-from-URL.
	// If popstate doesn't fire on iOS Chrome, arm the guard when we detect URL-driven close.
	$effect(() => {
		const shouldBeOpen = page.url.searchParams.get('dialog') === DIALOG_KEY;
		const closingCandidate = prevShouldBeOpen && !shouldBeOpen;

		if (isIOS && closingCandidate && !backSwipeGuard && !internalCloseGuard) {
			backSwipeGuard = true;
			if (guardTimer) clearTimeout(guardTimer);
			guardTimer = setTimeout(() => {
				backSwipeGuard = false;
				guardTimer = null;
			}, 650);
		}

		const closingFromUrl = closingCandidate && backSwipeGuard;
		suppressDialogRender = !!closingFromUrl;
		organizationProfileDialogOpen = closingFromUrl ? false : shouldBeOpen;
		prevShouldBeOpen = shouldBeOpen;
	});

	// 3: Open via button — push history entry + open immediately for snappy UX
	function openProfileModal() {
		switcherPopoverOpen = false;

		const url = new URL(page.url);
		if (url.searchParams.get('dialog') !== DIALOG_KEY) {
			url.searchParams.set('dialog', DIALOG_KEY);
			// IMPORTANT: use goto so $page.url updates and back works properly
			goto(`${url.pathname}${url.search}${url.hash}`, {
				replaceState: false, // create a back entry
				noScroll: true,
				keepFocus: true
			});
		}
	}

	// 4: If user closes via backdrop / X, remove the param with replaceState
	function closeProfileModal() {
		// Mark programmatic close so we don't arm back-swipe guard from URL-driven close
		internalCloseGuard = true;
		if (internalCloseTimer) clearTimeout(internalCloseTimer);
		internalCloseTimer = setTimeout(() => {
			internalCloseGuard = false;
			internalCloseTimer = null;
		}, 500);
		const hasDialog = page.url.searchParams.get('dialog') === DIALOG_KEY;
		if (hasDialog) {
			const url = new URL(page.url);
			url.searchParams.delete('dialog');
			url.searchParams.delete('tab');
			goto(`${url.pathname}${url.search}${url.hash}`, {
				replaceState: true, // no extra history entry
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

		const onPopState = () => {
			if (!isIOS) return;
			// Only arm guard when the dialog is actually closing via history (not when switching tabs)
			const url = new URL(window.location.href);
			const shouldBeOpen = url.searchParams.get('dialog') === DIALOG_KEY;
			const closingCandidate = prevShouldBeOpen && !shouldBeOpen;
			if (closingCandidate) {
				backSwipeGuard = true;
				if (guardTimer) clearTimeout(guardTimer);
				guardTimer = setTimeout(() => {
					backSwipeGuard = false;
					guardTimer = null;
				}, 650);
			}
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});

	// While guard is active, suppress transitions; release slightly after.
	$effect(() => {
		if (backSwipeGuard) {
			suppressDialogTransition = true;
		} else if (suppressDialogTransition) {
			setTimeout(() => (suppressDialogTransition = false), 100);
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

{#if !AUTH_CONSTANTS.organizations}
	<div class="text-error-600-400">
		Organizations are disabled, but OrganizationSwitcher is being used. Please turn them on in
		auth.constants.ts
	</div>

	<!-- Not authenticated - don't show anything -->
{:else if !isAuthenticated}
	<!-- Return null by not rendering anything -->

	<!-- Loading state -->
{:else if isLoading || !organizations || organizationsResponse.isLoading}
	<div class="placeholder h-8 w-40 animate-pulse"></div>

	<!-- No organizations - show create organization modal -->
{:else if organizations.length === 0}
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

	<!-- Has organizations - show the switcher -->
{:else}
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

					{#each organizations.filter((org) => org && org.id !== activeOrganization?.id) as org (org?.id)}
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

	{#if !suppressDialogRender}
		<!-- Organization Profile Modal -->
		<Dialog.Root
			bind:open={organizationProfileDialogOpen}
			onOpenChange={(status) => {
				if (!status.open) {
					closeProfileModal();
				}
			}}
		>
			<Dialog.Content
				class={`md:rounded-container top-0 left-0 h-full max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-none p-0 md:top-1/2 md:left-1/2 md:h-[70vh] md:w-2xl md:-translate-x-1/2 md:-translate-y-1/2 lg:w-4xl ${suppressDialogTransition ? 'animate-none transition-none duration-0 data-[state=closed]:duration-0 data-[state=open]:duration-0' : ''}`}
			>
				<div
					class="h-full w-full overflow-auto overscroll-contain"
					onfocusin={(e) => {
						const el = e.target as HTMLElement | null;
						if (!el) return;

						// On iOS, avoid programmatic scrolling to prevent subtle jank during history gestures
						if (isIOS) return;

						// Only scroll for actual editable controls to avoid jumping the dialog
						const tag = el.tagName.toLowerCase();
						const isEditableTag = tag === 'input' || tag === 'textarea' || tag === 'select';
						const isContentEditable =
							el.isContentEditable || el.getAttribute('contenteditable') === 'true';
						const role = el.getAttribute('role');
						const isTextboxLike = role === 'textbox' || role === 'combobox' || role === 'searchbox';

						// Ignore non-editable interactions (e.g., buttons that open nested dialogs)
						const isButtonLike =
							tag === 'button' || tag === 'a' || el.closest('[data-part="trigger"]');

						if ((isEditableTag || isContentEditable || isTextboxLike) && !isButtonLike) {
							el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
						}
					}}
				>
					<OrganizationProfile
						open={organizationProfileDialogOpen}
						onSuccessfulDelete={closeOrganizationProfile}
					/>
				</div>
				<Dialog.CloseX />
			</Dialog.Content>
		</Dialog.Root>
	{/if}
{/if}
