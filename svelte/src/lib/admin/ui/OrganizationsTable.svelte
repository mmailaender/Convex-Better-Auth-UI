<script lang="ts">
	// Primitives
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Menu from '#lib/primitives/ui/menu/index.js';
	import { Portal } from '@ark-ui/svelte/portal';
	// Icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import TrashIcon from '@lucide/svelte/icons/trash';
	import UsersIcon from '@lucide/svelte/icons/users';
	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Constants
	import { LIST_MAX } from '#lib/admin/utils/admin.constants.js';
	// Types
	import type { AdminOrganization } from '#lib/admin/types.js';

	let {
		onViewProfile
	}: {
		/** Opens the profile of a user */
		onViewProfile: (userId: string) => void;
	} = $props();

	const PAGE_SIZE = 25;

	const { api } = getAuthContext();
	const client = useConvexClient();

	// "Load more" raises the limit of one reactive list, like the users table
	let limit = $state(PAGE_SIZE);
	const orgsQuery = useQuery(api.admin.queries.listAllOrganizations, () => ({ limit }), {
		keepPreviousData: true
	});
	const organizations = $derived(orgsQuery.data?.organizations ?? []);

	let selectedOrg = $state<AdminOrganization | null>(null);
	let membersOpen = $state(false);
	let deleteOpen = $state(false);
	let deleting = $state(false);

	const orgDetailResponse = useQuery(api.admin.queries.getOrganizationWithMembers, () =>
		membersOpen && selectedOrg ? { organizationId: selectedOrg._id } : 'skip'
	);
	const orgDetail = $derived(orgDetailResponse?.data);

	function openDialog(org: AdminOrganization, dialog: 'members' | 'delete') {
		selectedOrg = org;
		membersOpen = dialog === 'members';
		deleteOpen = dialog === 'delete';
	}

	async function handleDelete() {
		const org = selectedOrg;
		if (!org) return;
		deleting = true;
		try {
			await client.mutation(api.admin.mutations.deleteOrganizationAsAdmin, {
				organizationId: org._id
			});
			toast.success(`Deleted ${org.name}`);
			deleteOpen = false;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
		} finally {
			deleting = false;
		}
	}
</script>

<div class="flex h-full flex-col py-4">
	{#if orgsQuery.error}
		<div class="text-error-600-400 p-4 text-sm">{orgsQuery.error.message}</div>
	{:else if !orgsQuery.data}
		<div class="text-surface-600-400 flex items-center gap-2 p-4 text-sm" role="status">
			<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
			Loading organizations...
		</div>
	{:else if organizations.length === 0}
		<div class="text-surface-600-400 p-4 text-sm">No organizations yet.</div>
	{:else}
		<div class="max-h-[calc(80vh-12rem)] overflow-y-auto pb-12">
			<table class="table w-full">
				<thead class="bg-surface-50-950 sticky top-0 z-20">
					<tr>
						<th class="text-surface-600-400 p-2 !pl-3 text-left text-xs font-semibold">Name</th>
						<th class="text-surface-600-400 hidden p-2 text-left text-xs sm:table-cell">Slug</th>
						<th class="text-surface-600-400 hidden w-28 p-2 text-left text-xs md:table-cell">
							Created
						</th>
						<th class="w-12 p-2"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each organizations as org (org._id)}
						<tr
							class="!border-surface-300-700 hover:bg-surface-100-900 cursor-pointer !border-t"
							onclick={() => openDialog(org, 'members')}
						>
							<td class="max-w-0 !py-3 !pl-3">
								<div class="flex items-center gap-2">
									<Avatar.Root class="size-8 shrink-0 sm:size-6">
										<Avatar.Image src={org.logo ?? undefined} alt={org.name} />
										<Avatar.Fallback>
											<Avatar.Marble name={org.name} />
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex min-w-0 flex-col">
										<!-- The keyboard way to the members; the row handles pointer clicks -->
										<button
											type="button"
											class="truncate text-left text-sm font-medium hover:underline"
											onclick={(event) => {
												event.stopPropagation();
												openDialog(org, 'members');
											}}
										>
											{org.name}
										</button>
										<span class="text-surface-700-300 truncate text-xs sm:hidden">{org.slug}</span>
									</div>
								</div>
							</td>
							<td class="text-surface-600-400 hidden max-w-0 truncate text-sm sm:table-cell">
								{org.slug}
							</td>
							<td class="text-surface-600-400 hidden text-sm md:table-cell">
								{new Date(org.createdAt).toLocaleDateString()}
							</td>
							<!-- Clicks on the menu don't open the members -->
							<td class="text-right" onclick={(event) => event.stopPropagation()}>
								<Menu.Root>
									<Menu.Trigger
										class="btn-icon hover:preset-tonal"
										aria-label={`Actions for ${org.name}`}
									>
										<EllipsisVerticalIcon class="size-4" aria-hidden="true" />
									</Menu.Trigger>
									<Portal>
										<Menu.Content class="bg-surface-50-950">
											<Menu.Item value="members" onclick={() => openDialog(org, 'members')}>
												<UsersIcon aria-hidden="true" />
												View members
											</Menu.Item>
											<Menu.Separator />
											<Menu.Item
												value="delete"
												variant="destructive"
												onclick={() => openDialog(org, 'delete')}
											>
												<TrashIcon aria-hidden="true" />
												Delete organization
											</Menu.Item>
										</Menu.Content>
									</Portal>
								</Menu.Root>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if orgsQuery.data.hasMore && limit >= LIST_MAX}
				<p class="text-surface-600-400 py-3 text-center text-xs">
					Showing the newest {LIST_MAX} organizations.
				</p>
			{:else if orgsQuery.data.hasMore}
				<div class="flex justify-center py-3">
					<button
						type="button"
						class="btn preset-tonal"
						onclick={() => (limit = Math.min(limit + PAGE_SIZE, LIST_MAX))}
						disabled={orgsQuery.isStale}
					>
						Load more
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Members dialog -->
	<Dialog.Root bind:open={membersOpen}>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>{selectedOrg?.name}</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					{#if orgDetail}
						{orgDetail.members.length}
						{orgDetail.members.length === 1 ? 'member' : 'members'}
					{:else}
						Members
					{/if}
				</Dialog.Description>
			</Dialog.Header>
			<div class="flex max-h-[60vh] w-full flex-col gap-1 overflow-y-auto px-2">
				{#if orgDetailResponse.error}
					<div class="text-error-600-400 text-sm">{orgDetailResponse.error.message}</div>
				{:else if !orgDetail}
					<div class="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Loading members...
					</div>
				{:else if orgDetail.members.length === 0}
					<div class="text-surface-600-400 text-sm">No members.</div>
				{:else}
					{#each orgDetail.members as member (member._id)}
						{@const memberUser = member.user}
						<!-- Members open their profile, where admins change their roles and memberships -->
						<button
							type="button"
							class="hover:bg-surface-200-800 rounded-base -mx-2 flex items-center gap-3 p-2 text-left disabled:cursor-default disabled:hover:bg-transparent"
							disabled={!memberUser}
							onclick={() => {
								if (!memberUser) return;
								membersOpen = false;
								onViewProfile(memberUser._id);
							}}
						>
							<Avatar.Root class="size-8 shrink-0">
								<Avatar.Image src={memberUser?.image ?? undefined} alt={memberUser?.name ?? ''} />
								<Avatar.Fallback>
									<Avatar.Marble name={memberUser?.name ?? '?'} />
								</Avatar.Fallback>
							</Avatar.Root>
							<div class="flex min-w-0 flex-1 flex-col">
								<span class="truncate text-sm">{memberUser?.name ?? 'Deleted user'}</span>
								<span class="text-surface-700-300 truncate text-xs">{memberUser?.email}</span>
							</div>
							<span
								class="badge h-6 shrink-0 border px-2 capitalize {member.role === 'owner'
									? 'preset-filled-primary-50-950 border-primary-200-800'
									: member.role === 'admin'
										? 'preset-filled-warning-50-950 border-warning-200-800'
										: 'preset-filled-surface-300-700 border-surface-400-600'}"
							>
								{member.role}
							</span>
							{#if memberUser}
								<ChevronRightIcon class="size-4 shrink-0 opacity-60" aria-hidden="true" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete dialog -->
	<Dialog.Root bind:open={deleteOpen}>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Delete {selectedOrg?.name}</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					This permanently deletes the organization with its memberships and pending invitations.
					Members who had it active switch to another of their organizations. This can't be undone.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Dialog.Close class="btn preset-tonal" disabled={deleting}>Cancel</Dialog.Close>
				<button
					type="button"
					class="btn preset-filled-error-500"
					onclick={handleDelete}
					disabled={deleting}
					aria-busy={deleting}
				>
					{#if deleting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Deleting...
					{:else}
						Delete organization
					{/if}
				</button>
			</Dialog.Footer>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
</div>
