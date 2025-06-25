<script lang="ts">
	// SvelteKit
	import { goto } from '$app/navigation';

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
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { api } from '$convex/_generated/api';
	const client = useConvexClient();

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import type { ComponentProps } from 'svelte';
	type PopoverProps = ComponentProps<typeof Popover.Content>;

	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type UserOrganizationsResponse = FunctionReturnType<
		typeof api.organizations.queries.getUserOrganizations
	>;

	// Props
	const {
		popoverSide = 'bottom',
		popoverAlign = 'end',
		initialData
	}: {
		/** Side the popover appears on relative to the trigger */
		popoverSide?: PopoverProps['side'];
		/** Alignment of the popover relative to the trigger */
		popoverAlign?: PopoverProps['align'];
		initialData?: {
			userOrganizations: UserOrganizationsResponse;
			activeOrganization: ActiveOrganizationResponse;
		};
	} = $props();

	// Authentication state
	const isLoading = $derived(useAuth().isLoading);
	const isAuthenticated = $derived(useAuth().isAuthenticated);

	// Queries
	const organizationsResponse = useQuery(
		api.organizations.queries.getUserOrganizations,
		{},
		{ initialData: initialData?.userOrganizations }
	);
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);

	// Derived state
	const organizations = $derived(organizationsResponse.data);
	const activeOrganization = $derived(activeOrganizationResponse.data);

	// Component state
	let switcherPopoverOpen: boolean = $state(false);
	let createOrganizationDialogOpen: boolean = $state(false);
	let organizationProfileDialogOpen: boolean = $state(false);

	// Handler functions

	function closeCreateOrganization(): void {
		createOrganizationDialogOpen = false;
	}

	function closeOrganizationProfile(): void {
		organizationProfileDialogOpen = false;
	}

	/**
	 * Updates the active organization
	 */
	async function updateActiveOrg(organizationId: Id<'organizations'>): Promise<void> {
		try {
			await client.mutation(api.organizations.mutations.setActiveOrganization, { organizationId });

			// Close popover and refresh
			switcherPopoverOpen = false;
			goto(window.location.href, { replaceState: true }); // refresh page
		} catch (err) {
			console.error(err);
		}
	}

	function openCreateOrgModal(): void {
		createOrganizationDialogOpen = true;
		switcherPopoverOpen = false;
	}

	function openProfileModal(): void {
		organizationProfileDialogOpen = true;
		switcherPopoverOpen = false;
	}
</script>

<!-- Not authenticated - don't show anything -->
{#if !isAuthenticated}
	<!-- Return null by not rendering anything -->

	<!-- Loading state -->
{:else if isLoading || !organizations}
	<div class="placeholder h-8 w-40 animate-pulse"></div>

	<!-- No organizations - just show the create button -->
{:else if organizations.length === 0}
	<Dialog.Root bind:open={createOrganizationDialogOpen}>
		<Dialog.Trigger class="btn variant-soft flex items-center gap-2">
			<Plus class="size-4" />
			<span>Create Organization</span>
		</Dialog.Trigger>

		<Dialog.Content>
			<CreateOrganization onSuccessfulCreate={closeCreateOrganization} />
			<button
				class="btn-icon variant-ghost absolute top-2 right-2"
				onclick={closeCreateOrganization}
			>
				<X class="size-4" />
			</button>
		</Dialog.Content>
	</Dialog.Root>

	<!-- Has organizations - show the switcher -->
{:else}
	<Popover.Root bind:open={switcherPopoverOpen}>
		<Popover.Trigger
			class="hover:bg-surface-200-800 border-surface-200-800 rounded-container flex w-40 flex-row items-center justify-between border p-1 pr-2 duration-200 ease-in-out"
		>
			<div class="flex w-full max-w-64 items-center gap-3 overflow-hidden">
				<Avatar.Root class="bg-surface-400-600 rounded-container size-8 shrink-0">
					<Avatar.Image src={activeOrganization?.logo || ''} alt={activeOrganization?.name || ''} />
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
		<Popover.Content side={popoverSide} align={popoverAlign}>
			<div class="flex flex-col gap-1">
				<div role="list" class="bg-surface-50-950 rounded-base flex flex-col">
					<div
						class="text-surface-700-300 border-surface-200-800 flex max-w-80 items-center gap-3 border-b p-3 text-sm/6"
					>
						<Avatar.Root class="bg-surface-400-600 rounded-container size-8 shrink-0">
							<Avatar.Image
								src={activeOrganization?.logo || ''}
								alt={activeOrganization?.name || ''}
							/>
							<Avatar.Fallback>
								<Building2 class="size-5" />
							</Avatar.Fallback>
						</Avatar.Root>
						<span class="text-surface-700-300 text-medium w-full truncate text-base">
							{activeOrganization?.name}
						</span>
						{#if activeOrganization?.role === 'role_organization_owner' || activeOrganization?.role === 'role_organization_admin'}
							<button
								onclick={openProfileModal}
								class="btn-icon preset-faded-surface-50-950 hover:preset-filled-surface-300-700 flex gap-2"
							>
								<Settings class="size-4" />
							</button>
						{:else if activeOrganization}
							<LeaveOrganization />
						{/if}
					</div>

					{#each organizations.filter((org) => org && org._id !== activeOrganization?._id) as org}
						{#if org}
							<div>
								<button
									onclick={() => updateActiveOrg(org._id)}
									class="group hover:bg-surface-100-900/50 flex w-full max-w-80 items-center gap-3 p-3"
								>
									<Avatar.Root class="bg-surface-400-600 rounded-container size-8 shrink-0">
										<Avatar.Image src={org.logo || ''} alt={org.name || ''} />
										<Avatar.Fallback>
											<Building2 class="size-5" />
										</Avatar.Fallback>
									</Avatar.Root>
									<span class="text-surface-700-300 truncate text-base">
										{org.name}
									</span>
								</button>
							</div>
						{/if}
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
		<Dialog.Content class="max-w-xl">
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
			class="md:rounded-container h-[100dvh] max-h-[100dvh] w-[100dvw] rounded-none p-0 md:h-[70vh] md:w-4xl"
		>
			<Dialog.Header class="hidden">
				<Dialog.Title></Dialog.Title>
			</Dialog.Header>
			<OrganizationProfile onSuccessfulDelete={closeOrganizationProfile} />
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{/if}
