<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { ChevronsUpDown, Plus, Settings, X } from 'lucide-svelte';
	import { Avatar, Modal, Popover } from '@skeletonlabs/skeleton-svelte';

	import { callForm } from '$lib/primitives/api/callForm';
	import CreateOrganization from './CreateOrganization.svelte';
	import OrganizationProfile from './OrganizationProfile.svelte';
	import LeaveOrganization from './LeaveOrganization.svelte';

	import type { Organization, User } from '$lib/db/schema/types/custom';

	let user: User | null = $state(JSON.parse(page.data.user ?? null));
	let derivedUser: User | null = $derived(JSON.parse(page.data.user ?? null));

	$effect(() => {
		user = derivedUser;
	});

	let activeOrg = $derived(user?.activeOrganization);
	let orgs = $derived(user?.organizations);

	let openStateSwitcher = $state(false);
	let openStateCreateOrganization = $state(false);
	let openStateOrganizationProfile = $state(false);

	async function updateActiveOrg(organizationId: string) {
		try {
			const org = await callForm<Organization>({
				url: '/org?/setActiveOrganization',
				data: { organizationId }
			});
			user!.activeOrganization = org;

			goto('/', { invalidateAll: true });
		} catch (err) {
			console.error(err);
		}

		openStateSwitcher = false;
	}
</script>

{#if user && orgs && orgs.length > 0}
	<Popover
		bind:open={openStateSwitcher}
		positioning={{ placement: 'bottom-end' }}
		triggerBase="btn"
		contentBase="card bg-surface-200-800 max-w-80"
	>
		{#snippet trigger()}
			<div class="flex items-center gap-2">
				<Avatar src={activeOrg!.logo} name={activeOrg!.name} size="size-6" />
				<span class="text-surface-700-300 text-base font-semibold">{activeOrg!.name}</span>
				<ChevronsUpDown size="12" />
			</div>
		{/snippet}
		{#snippet content()}
			<ul role="list" class="space-y-1">
				<li>
					<div
						class="rounded-base text-surface-700-300 flex items-center gap-x-3 p-4 text-sm/6 font-semibold"
					>
						<Avatar src={activeOrg!.logo} name={activeOrg!.name} size="size-6" />
						<span class="text-surface-700-300 text-base font-semibold">{activeOrg!.name}</span>
						{#if user!.roles.some( (role) => ['role_organization_owner', 'role_organization_admin'].includes(role) )}
							<button
								onclick={() => {
									openStateOrganizationProfile = true;
									openStateSwitcher = false;
								}}
								class="btn preset-outlined-surface-500 flex gap-2"
							>
								<Settings size="16" />
								<span>Manage</span>
							</button>
						{:else}
							<LeaveOrganization bind:user={user!} />
						{/if}
					</div>
				</li>

				{#each orgs as org}
					{#if org.id !== activeOrg!.id}
						<li>
							<button
								onclick={() => updateActiveOrg(org.id)}
								class="group rounded-base text-surface-700-300 hover:text-primary-600-400 flex gap-x-3 p-4 text-sm/6 font-semibold hover:bg-gray-50"
							>
								<Avatar src={org!.logo} name={org!.name} size="size-6" />
								<span class="text-surface-700-300 text-base font-semibold">{org!.name}</span>
							</button>
						</li>
					{/if}
				{/each}
				<li>
					<Modal
						bind:open={openStateCreateOrganization}
						triggerBase="btn preset-tonal"
						contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm) min-w-96"
						backdropClasses="backdrop-blur-xs"
					>
						{#snippet trigger()}
							<Plus size="16" />
							<span>Create Organization</span>
						{/snippet}
						{#snippet content()}
							<CreateOrganization />
						{/snippet}
					</Modal>
				</li>
			</ul>
		{/snippet}
	</Popover>
	<Modal
		bind:open={openStateOrganizationProfile}
		triggerBase="btn preset-tonal"
		contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm) min-w-96 relative"
		backdropClasses="backdrop-blur-xs"
	>
		{#snippet content()}
			<OrganizationProfile />
			<button
				type="button"
				class="btn-icon preset-tonal absolute top-3 right-3 rounded-full"
				onclick={() => (openStateOrganizationProfile = false)}><X size="16" /></button
			>
		{/snippet}
	</Modal>
{:else if user}
	<Modal
		bind:open={openStateCreateOrganization}
		triggerBase="btn preset-tonal"
		contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm) min-w-96"
		backdropClasses="backdrop-blur-xs"
	>
		{#snippet trigger()}
			<Plus size="16" />
			<span>Create Organization</span>
		{/snippet}
		{#snippet content()}
			<CreateOrganization />
		{/snippet}
	</Modal>
{/if}
