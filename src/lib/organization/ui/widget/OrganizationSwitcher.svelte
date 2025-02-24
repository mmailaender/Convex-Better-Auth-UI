<script lang="ts">
	import { page } from '$app/state';
	import { ChevronsUpDown, Plus, Settings } from 'lucide-svelte';
	import { Avatar, Modal, Popover } from '@skeletonlabs/skeleton-svelte';

	import CreateOrganization from './CreateOrganization.svelte';

	import type { User } from '$lib/db/schema/types/custom';

	let user: User | null = $state(JSON.parse(page.data.user));

	let activeOrg = $derived(user!.activeOrganization);
	let orgs = $derived(user!.organizations);

	$inspect('OrganizationSwitcher orgs: ', orgs);

	let openStateSwitcher = $state(false);
	let openStateCreateOrganization = $state(false);

	function toggleUserProfile() {
		openStateSwitcher = false;
		openStateCreateOrganization = !openStateCreateOrganization;
	}

	function updateActiveOrg(orgId: string) {
		// TODO
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
				<span class="text-base font-semibold text-surface-700-300">{activeOrg!.name}</span>
				<ChevronsUpDown size="12" />
			</div>
		{/snippet}
		{#snippet content()}
			<ul role="list" class="space-y-1">
				<li>
					<div
						class="flex items-center gap-x-3 rounded-md p-4 text-sm/6 font-semibold text-surface-700-300"
					>
						<Avatar src={activeOrg!.logo} name={activeOrg!.name} size="size-6" />
						<span class="text-base font-semibold text-surface-700-300">{activeOrg!.name}</span>
						<a
							href="/org/${activeOrg!.id}/profile"
							class="btn flex gap-2 preset-outlined-surface-500"
							onclick={toggleUserProfile}
						>
							<Settings size="16" />
							<span>Manage</span>
						</a>
					</div>
				</li>

				{#each orgs as org}
					{#if org.id !== activeOrg!.id}
						<li>
							<button
								onclick={() => updateActiveOrg(org.id)}
								class="group flex gap-x-3 rounded-md p-4 text-sm/6 font-semibold text-surface-700-300 hover:bg-gray-50 hover:text-primary-600-400"
							>
								<Avatar src={org!.logo} name={org!.name} size="size-6" />
								<span class="text-base font-semibold text-surface-700-300">{org!.name}</span>
							</button>
						</li>
					{/if}
				{/each}
				<li>
					<Modal
						bind:open={openStateCreateOrganization}
						triggerBase="btn preset-tonal"
						contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm min-w-96"
						backdropClasses="backdrop-blur-sm"
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
{:else if user}
	<Modal
		bind:open={openStateCreateOrganization}
		triggerBase="btn preset-tonal"
		contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm min-w-96"
		backdropClasses="backdrop-blur-sm"
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
