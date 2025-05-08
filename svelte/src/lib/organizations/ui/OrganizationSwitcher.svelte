<script lang="ts">
	// Navigation
	import { goto } from '$app/navigation';

	// Components
	import { Avatar, Popover, Modal } from '@skeletonlabs/skeleton-svelte';
	import { ChevronsUpDown, Plus, Settings, X } from 'lucide-svelte';
	import CreateOrganization from '$lib/organizations/ui/CreateOrganization.svelte';
	import OrganizationProfile from '$lib/organizations/ui/OrganizationProfile.svelte';
	import LeaveOrganization from '$lib/organizations/ui/LeaveOrganization.svelte';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { useAuth } from '@convex-dev/auth/sveltekit';
	import { api } from '$convex/_generated/api';
	const client = useConvexClient();

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import type { ComponentProps } from 'svelte';
	type PopoverProps = ComponentProps<typeof Popover>;
	type PlacementType = NonNullable<PopoverProps['positioning']>['placement'];

	// Props
	const props: { popoverPlacement?: PlacementType } = $props();
	// Default to 'bottom-end' if no placement provided
	const popoverPlacement = props.popoverPlacement || 'bottom-end';

	// Authentication state
	const isLoading = $derived(useAuth().isLoading);
	const isAuthenticated = $derived(useAuth().isAuthenticated);

	// Queries
	const organizationsResponse = useQuery(api.organizations.getUserOrganizations, {});
	const activeOrganizationResponse = useQuery(api.organizations.getActiveOrganization, {});

	// Derived state
	const organizations = $derived(organizationsResponse.data);
	const activeOrganization = $derived(activeOrganizationResponse.data);

	// Component state
	let openSwitcher: boolean = $state(false);
	let openCreateOrganization: boolean = $state(false);
	let openOrganizationProfile: boolean = $state(false);

	// Handler functions
	function closeSwitcher(): void {
		openSwitcher = false;
	}

	function closeCreateOrganization(): void {
		openCreateOrganization = false;
	}

	function closeOrganizationProfile(): void {
		openOrganizationProfile = false;
	}

	/**
	 * Updates the active organization
	 */
	async function updateActiveOrg(organizationId: Id<'organizations'>): Promise<void> {
		try {
			await client.mutation(api.organizations.setActiveOrganization, { organizationId });

			// Close popover and refresh
			closeSwitcher();
			goto(window.location.href, { replaceState: true }); // refresh page
		} catch (err) {
			console.error(err);
		}
	}

	function openCreateOrgModal(): void {
		openCreateOrganization = true;
		closeSwitcher();
	}

	function openProfileModal(): void {
		openOrganizationProfile = true;
		closeSwitcher();
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
	<Modal
		open={openCreateOrganization}
		onOpenChange={(e) => (openCreateOrganization = e.open)}
		triggerBase="btn variant-soft flex items-center gap-2"
		contentBase="card bg-surface-100-900 relative max-w-screen-sm space-y-4 p-4 shadow-xl"
	>
		{#snippet trigger()}
			<Plus class="size-4" />
			<span>Create Organization</span>
		{/snippet}

		{#snippet content()}
			<CreateOrganization onSuccessfulCreate={closeCreateOrganization} />
			<button
				class="btn-icon variant-ghost absolute top-2 right-2"
				onclick={closeCreateOrganization}
			>
				<X class="size-4" />
			</button>
		{/snippet}
	</Modal>

	<!-- Has organizations - show the switcher -->
{:else}
	<Popover
		open={openSwitcher}
		onOpenChange={(e) => (openSwitcher = e.open)}
		positioning={{ placement: popoverPlacement }}
		triggerBase="flex items-center gap-2"
		contentBase="floating card bg-surface-200-800 max-w-100 p-4"
	>
		{#snippet trigger()}
			<Avatar
				src={activeOrganization?.logo || ''}
				name={activeOrganization?.name || ''}
				size="size-6"
			/>
			<span class="text-surface-700-300 text-base font-semibold">
				{activeOrganization?.name}
			</span>
			<ChevronsUpDown class="size-3" />
		{/snippet}

		{#snippet content()}
			<ul role="list" class="space-y-1">
				<li>
					<div
						class="rounded-base text-surface-700-300 flex items-center gap-x-3 p-2 text-sm font-semibold"
					>
						<Avatar
							src={activeOrganization?.logo || ''}
							name={activeOrganization?.name || ''}
							size="size-6"
						/>
						<span class="text-surface-700-300 text-base font-semibold">
							{activeOrganization?.name}
						</span>
						{#if activeOrganization?.role === 'role_organization_owner' || activeOrganization?.role === 'role_organization_admin'}
							<button onclick={openProfileModal} class="btn variant-outline-surface flex gap-2">
								<Settings class="size-4" />
								<span class="text-xs">Manage</span>
							</button>
						{:else if activeOrganization}
							<LeaveOrganization />
						{/if}
					</div>
				</li>

				{#each organizations.filter((org) => org && org._id !== activeOrganization?._id) as org}
					{#if org}
						<li>
							<button
								onclick={() => updateActiveOrg(org._id)}
								class="group rounded-base text-surface-700-300 hover:text-primary-600-400 hover:bg-surface-100-900 flex w-full gap-x-3 p-2 text-sm font-semibold"
							>
								<Avatar src={org.logo || ''} name={org.name} size="size-6" />
								<span class="text-surface-700-300 text-base font-semibold">
									{org.name}
								</span>
							</button>
						</li>
					{/if}
				{/each}

				<li>
					<button
						onclick={openCreateOrgModal}
						class="btn variant-soft mt-2 flex w-full items-center gap-2"
					>
						<Plus class="size-4" />
						<span>Create Organization</span>
					</button>
				</li>
			</ul>
		{/snippet}
	</Popover>

	<!-- Create Organization Modal -->
	<Modal
		open={openCreateOrganization}
		onOpenChange={(e) => (openCreateOrganization = e.open)}
		contentBase="card p-4 w-full max-w-md shadow-xl"
	>
		{#snippet content()}
			<div class="relative">
				<CreateOrganization onSuccessfulCreate={closeCreateOrganization} />
				<button
					class="btn-icon variant-ghost absolute top-2 right-2"
					onclick={closeCreateOrganization}
				>
					<X class="size-4" />
				</button>
			</div>
		{/snippet}
	</Modal>

	<!-- Organization Profile Modal -->
	<Modal
		open={openOrganizationProfile}
		onOpenChange={(e) => (openOrganizationProfile = e.open)}
		contentBase="card bg-surface-100-900 relative space-y-4 p-4 shadow-xl"
		backdropBase="bg-surface-50-950/75 fixed top-0 right-0 bottom-0 left-0 flex items-center justify-center p-4 backdrop-blur-sm"
	>
		{#snippet content()}
			<div class="relative">
				<OrganizationProfile onSuccessfulDelete={closeOrganizationProfile} />
				<button
					class="btn-icon variant-ghost absolute top-2 right-2"
					onclick={closeOrganizationProfile}
				>
					<X class="size-4" />
				</button>
			</div>
		{/snippet}
	</Modal>
{/if}
