<script lang="ts">
	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Drawer from '$lib/primitives/ui/drawer';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import { toast } from 'svelte-sonner';
	// Icons
	import { Search, Trash, Pencil } from '@lucide/svelte';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	// API Types
	import type { Doc, Id } from '$convex/_generated/dataModel';
	type Role = Doc<'organizationMembers'>['role'];
	import type { FunctionReturnType } from 'convex/server';
	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type MembersResponse = FunctionReturnType<
		typeof api.organizations.members.queries.getOrganizationMembers
	>;
	type UserResponse = FunctionReturnType<typeof api.users.queries.getUser>;
	type GetOrganizationMemberReturnType = MembersResponse extends Array<infer T> ? T : never;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeOrganization: ActiveOrganizationResponse;
			members: MembersResponse;
			user: UserResponse;
		};
	} = $props();

	// Queries
	const currentUserResponse = useQuery(
		api.users.queries.getUser,
		{},
		{ initialData: initialData?.user }
	);
	const currentOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);
	const membersResponse = useQuery(
		api.organizations.members.queries.getOrganizationMembers,
		{},
		{ initialData: initialData?.members }
	);

	// State
	let selectedUserId: Id<'users'> | null = $state(null);
	let searchQuery: string = $state('');
	let isDialogOpen: boolean = $state(false);
	let isDrawerOpen: boolean = $state(false);
	let selectedMember: GetOrganizationMemberReturnType | null = $state(null);

	// Derived data
	const currentUser = $derived(currentUserResponse.data);
	const currentOrganization = $derived(currentOrganizationResponse.data);
	const members = $derived(membersResponse.data);
	const roles = createRoles();

	/**
	 * Filter and sort members based on search query and role
	 */
	const filteredMembers = $derived.by(() => {
		if (!members) return [];

		return members
			.filter((member) => {
				if (!searchQuery) return true;

				const memberName = member.user.name;
				return memberName.toLowerCase().includes(searchQuery.toLowerCase());
			})
			.sort((a, b) => {
				// Sort by role (owner first, then admin, then member)
				const roleOrder: Record<Role, number> = {
					role_organization_owner: 0,
					role_organization_admin: 1,
					role_organization_member: 2
				};

				// Primary sort by role
				const roleDiff = roleOrder[a.role] - roleOrder[b.role];
				if (roleDiff !== 0) return roleDiff;

				// Secondary sort by name
				return a.user.name.localeCompare(b.user.name);
			});
	});

	/**
	 * Handles updating a member's role
	 */
	async function handleUpdateRole(userId: Id<'users'>, newRole: Role): Promise<void> {
		if (newRole === 'role_organization_owner') return; // Cannot set someone as owner this way

		try {
			await client.mutation(api.organizations.members.mutations.updateMemberRole, {
				userId,
				newRole
			});

			toast.success('Role updated successfully!');
			isDrawerOpen = false;
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update role');
			console.error(err);
		}
	}

	/**
	 * Handles removing a member from the organization
	 */
	async function handleRemoveMember(): Promise<void> {
		if (!selectedUserId) return;

		try {
			await client.mutation(api.organizations.members.mutations.removeMember, {
				userId: selectedUserId
			});

			toast.success('Member removed successfully!');
			isDialogOpen = false;
			isDrawerOpen = false;
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Unknown error. Please try again. If it persists, contact support.'
			);
		}
	}

	/**
	 * Check if current user can edit a member
	 */
	function canEditMember(member: GetOrganizationMemberReturnType): boolean {
		if (!roles.isOwnerOrAdmin) return false;
		if (member.user._id === currentUser?._id) return false;
		if (member.role === 'role_organization_owner') return false;

		// If current user is admin, they can't edit other admins
		if (currentUser && members) {
			const currentUserMember = members.find((m) => m.user._id === currentUser._id);
			if (
				currentUserMember?.role === 'role_organization_admin' &&
				member.role === 'role_organization_admin'
			) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Handle member card click
	 */
	function handleMemberCardClick(member: GetOrganizationMemberReturnType): void {
		if (canEditMember(member)) {
			selectedMember = member;
			isDrawerOpen = true;
		}
	}

	/**
	 * Handle search input change
	 */
	function handleSearchChange(e: Event): void {
		const target = e.target as HTMLInputElement;
		searchQuery = target.value;
	}

	/**
	 * Handle role selection change
	 */
	function handleRoleChange(e: Event, userId: Id<'users'>): void {
		const target = e.target as HTMLSelectElement;
		handleUpdateRole(userId, target.value as Role);
	}
</script>

{#if members}
	<div class="flex h-full flex-col">
		<!-- Search Section - Fixed at top -->
		<div class="flex flex-shrink-0 items-center gap-3 py-4">
			<div class="relative flex-1">
				<div class="pointer-events-none absolute inset-y-0 flex items-center pl-2">
					<Search class="text-surface-400-600 size-4" />
				</div>
				<input
					type="text"
					class="input w-hug w-full !border-0 border-transparent pl-8 text-sm"
					placeholder="Search members..."
					value={searchQuery}
					onchange={handleSearchChange}
				/>
			</div>
		</div>

		<!-- Mobile Layout -->
		<div class="block min-h-0 flex-1 sm:hidden">
			<div class="flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pb-24">
				{#each filteredMembers as member (member._id)}
					<div
						class={`bg-surface-50-950 rounded-container flex items-center justify-between p-4 pr-6 ${
							canEditMember(member) ? 'hover:bg-surface-100-900 cursor-pointer' : ''
						}`}
						onclick={() => handleMemberCardClick(member)}
						role="button"
						tabindex="0"
						onkeydown={(e) => {
							if (e.key === 'Enter' || e.key === ' ') {
								handleMemberCardClick(member);
							}
						}}
					>
						<div class="flex items-center space-x-3">
							<div class="avatar">
								<div class="size-10">
									<Avatar.Root class="size-10">
										<Avatar.Image src={member.user.image} alt={member.user.name} />
										<Avatar.Fallback>
											<Avatar.Marble name={member.user.name} />
										</Avatar.Fallback>
									</Avatar.Root>
								</div>
							</div>
							<div class="flex flex-col">
								<div class="flex items-center space-x-2">
									<span class="font-medium">{member.user.name}</span>
									{#if member.role === 'role_organization_owner'}
										<span
											class="badge preset-filled-primary-50-950 border-primary-200-800 h-6 border px-2"
										>
											Owner
										</span>
									{/if}
									{#if member.role === 'role_organization_admin'}
										<span
											class="badge preset-filled-warning-50-950 border-warning-200-800 h-6 border px-2"
										>
											Admin
										</span>
									{/if}
								</div>
								<span class="text-surface-700-300 text-sm">{member.user.email}</span>
							</div>
						</div>
						{#if canEditMember(member)}
							<Pencil class="size-4 opacity-60" />
						{/if}
					</div>
				{/each}
			</div>
		</div>

		<!-- Desktop Table Layout -->
		<div class="hidden min-h-0 flex-1 sm:block">
			<div>
				<!-- Table container with controlled height and scroll -->
				<div
					class="max-h-[calc(90vh-12rem)] overflow-y-auto pb-12 sm:max-h-[calc(80vh-12rem)] md:max-h-[calc(70vh-12rem)]"
				>
					<table class="table w-full !table-fixed">
						<thead
							class="sm:bg-surface-200-800 bg-surface-100-900 border-surface-300-700 sticky top-0 z-20 border-b"
						>
							<tr>
								<th class="text-surface-700-300 !w-48 p-2 !pl-0 text-left text-xs">Name</th>
								<th class="text-surface-700-300 hidden p-2 text-left text-xs sm:flex">Email</th>
								<th class="text-surface-700-300 !w-32 p-2 text-left text-xs">Role</th>
								{#if roles.isOwnerOrAdmin}
									<th class="!w-16 p-2 text-right"></th>
								{/if}
							</tr>
						</thead>
						<tbody>
							{#each filteredMembers as member (member._id)}
								<tr class="!border-surface-300-700 !border-t">
									<!-- Member Name -->
									<td class="!w-48 !max-w-48 !truncate !py-3 !pl-0">
										<div class="flex items-center space-x-2">
											<div class="avatar">
												<div class="size-8 sm:size-5">
													<Avatar.Root class="size-8 sm:size-5">
														<Avatar.Image src={member.user.image} alt={member.user.name} />
														<Avatar.Fallback>
															<Avatar.Marble name={member.user.name} />
														</Avatar.Fallback>
													</Avatar.Root>
												</div>
											</div>

											<div class="flex flex-col truncate">
												<span class="truncate font-medium">{member.user.name}</span>
												<!-- Email visible only on mobile (hidden on sm and above) -->
												<span class="text-surface-700-300 truncate text-xs sm:hidden">
													{member.user.email}
												</span>
											</div>
										</div>
									</td>
									<!-- Member Email -->
									<td class="!text-surface-700-300 hidden !h-fit !w-full !truncate sm:table-cell">
										{member.user.email}
									</td>
									<!-- Member Role -->
									<td class="!w-32">
										<div class="flex items-center">
											{#if roles.isOwnerOrAdmin && member.user._id !== currentUser?._id && member.role !== 'role_organization_owner'}
												<select
													value={member.role}
													onchange={(e) => handleRoleChange(e, member.user._id)}
													class="select cursor-pointer text-sm"
												>
													<option value="role_organization_admin">Admin</option>
													<option value="role_organization_member">Member</option>
												</select>
											{:else if member.role === 'role_organization_owner'}
												<span
													class="badge preset-filled-primary-50-950 border-primary-200-800 h-6 border px-2"
												>
													Owner
												</span>
											{:else if member.role === 'role_organization_admin'}
												<span
													class="badge preset-filled-warning-50-950 border-warning-200-800 h-6 border px-2"
												>
													Admin
												</span>
											{:else}
												<span
													class="badge preset-filled-surface-300-700 border-surface-400-600 h-6 border px-2"
												>
													Member
												</span>
											{/if}
										</div>
									</td>
									<!-- Member Actions -->
									<td class="!w-16">
										<div class="flex justify-end space-x-2">
											{#if roles.isOwnerOrAdmin && member.user._id !== currentUser?._id && member.role !== 'role_organization_owner'}
												<Dialog.Root bind:open={isDialogOpen}>
													<Dialog.Trigger
														class="btn-icon preset-filled-surface-200-800 hover:preset-filled-error-300-700"
														onclick={() => (selectedUserId = member.user._id)}
													>
														<Trash class="size-4 opacity-70" />
													</Dialog.Trigger>
													<Dialog.Content class="md:max-w-108">
														<Dialog.Header class="flex-shrink-0">
															<Dialog.Title>Remove member</Dialog.Title>
														</Dialog.Header>
														<article class="flex-shrink-0">
															<p class="opacity-60">
																Are you sure you want to remove the member {member.user.name}?
															</p>
														</article>
														<Dialog.Footer class="flex-shrink-0">
															<button
																type="button"
																class="btn preset-tonal"
																onclick={() => (isDialogOpen = false)}
															>
																Cancel
															</button>
															<button
																type="button"
																class="btn preset-filled-error-500"
																onclick={handleRemoveMember}
															>
																Confirm
															</button>
														</Dialog.Footer>
													</Dialog.Content>
												</Dialog.Root>
											{/if}
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>

		<!-- Mobile Drawer -->
		<Drawer.Root bind:open={isDrawerOpen}>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>Edit Member</Drawer.Title>
				</Drawer.Header>
				<div class="">
					<!-- Member Info -->
					<div class="flex items-center gap-3 pt-1 pb-8">
						<div class="avatar">
							<div class="size-12">
								{#if selectedMember!.user.image}
									<Avatar.Root class="size-12">
										<Avatar.Image
											src={selectedMember!.user.image}
											alt={selectedMember!.user.name}
										/>
										<Avatar.Fallback>
											<Avatar.Marble name={selectedMember!.user.name} />
										</Avatar.Fallback>
									</Avatar.Root>
								{:else}
									<div
										class="text-primary-700 bg-primary-100 flex h-full w-full items-center justify-center rounded-full"
									>
										{selectedMember!.user.name?.charAt(0) || 'U'}
									</div>
								{/if}
							</div>
						</div>
						<div class="flex flex-col">
							<span>{selectedMember!.user.name}</span>
							<p class="text-surface-700-300 text-sm">{selectedMember!.user.email}</p>
						</div>
					</div>

					<!-- Actions -->
					<div class="flex flex-col gap-3">
						<!-- Role Select -->
						<label class="flex-1">
							<span class="label">Role</span>
							<select
								value={selectedMember!.role}
								onchange={(e) => handleRoleChange(e, selectedMember!.user._id)}
								class="select w-full"
							>
								<option value="role_organization_admin">Admin</option>
								<option value="role_organization_member">Member</option>
							</select>
						</label>

						<!-- Remove Button -->
						<div class="flex flex-col justify-end">
							<Dialog.Root bind:open={isDialogOpen}>
								<Dialog.Trigger
									class="btn preset-filled-surface-300-700"
									onclick={() => (selectedUserId = selectedMember!.user._id)}
								>
									<Trash class="size-4" /> Remove
								</Dialog.Trigger>
								<Dialog.Content class="md:max-w-108">
									<Dialog.Header class="flex-shrink-0">
										<Dialog.Title>Remove member</Dialog.Title>
									</Dialog.Header>
									<Dialog.Description>
										Are you sure you want to remove the member {selectedMember!.user.name}?
									</Dialog.Description>

									<Dialog.Footer class="flex-shrink-0">
										<button
											type="button"
											class="btn preset-tonal"
											onclick={() => (isDialogOpen = false)}
										>
											Cancel
										</button>
										<button
											type="button"
											class="btn preset-filled-error-500"
											onclick={handleRemoveMember}
										>
											Confirm
										</button>
									</Dialog.Footer>
								</Dialog.Content>
							</Dialog.Root>
						</div>
					</div>
				</div>
			</Drawer.Content>
		</Drawer.Root>
	</div>
{:else if !currentOrganization || !currentUser}
	<div>Failed to load members</div>
{:else}
	<div>Loading members...</div>
{/if}
