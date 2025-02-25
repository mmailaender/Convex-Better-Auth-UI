<script lang="ts">
	import { page } from '$app/state';
	import { ChevronsUpDown, Plus, Settings } from 'lucide-svelte';
	import { Avatar, Modal, Popover } from '@skeletonlabs/skeleton-svelte';

	import CreateOrganization from './CreateOrganization.svelte';

	import type { Organization, User } from '$lib/db/schema/types/custom';
	import { callForm } from '$lib/primitives/api/callForm';
	import { goto } from '$app/navigation';

	let user: User | null = $state(JSON.parse(page.data.user ?? null));

	let activeOrg = $derived(user?.activeOrganization);
	let orgs = $derived(user?.organizations);

	$inspect('OrganizationSwitcher orgs: ', orgs);

	let openStateSwitcher = $state(false);
	let openStateCreateOrganization = $state(false);

	function toggleUserProfile() {
		openStateSwitcher = false;
		openStateCreateOrganization = !openStateCreateOrganization;
	}

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
						<a
							href="/org/${activeOrg!.id}/profile"
							class="btn preset-outlined-surface-500 flex gap-2"
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
