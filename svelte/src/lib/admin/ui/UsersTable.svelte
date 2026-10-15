<script lang="ts">
	// SvelteKit
	import { resolve } from '$app/paths';
	// Primitives
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Menu from '#lib/primitives/ui/menu/index.js';
	import * as Password from '#lib/primitives/ui/password/index.js';
	import * as Select from '#lib/primitives/ui/select/index.js';
	import { Portal } from '@ark-ui/svelte/portal';
	import { createListCollection } from '@ark-ui/svelte/select';
	// Icons
	import SearchIcon from '@lucide/svelte/icons/search';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	// Components
	import CreateUser from '#lib/admin/ui/CreateUser.svelte';
	// API
	import { useQuery, useConvexClient, usePaginatedQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Constants
	import { USERS_PAGE_SIZE } from '#lib/admin/utils/admin.constants.js';
	// Types
	import type { AdminUser, AppRole } from '#lib/admin/types.js';

	const { api, authClient } = getAuthContext();
	const client = useConvexClient();
	const auth = useAuth();

	const roleCollection = createListCollection({
		items: [
			{ label: 'User', value: 'user' },
			{ label: 'Admin', value: 'admin' }
		]
	});

	const banDurations = [
		{ label: 'Permanent', value: '' },
		{ label: '1 hour', value: String(60 * 60) },
		{ label: '1 day', value: String(60 * 60 * 24) },
		{ label: '7 days', value: String(60 * 60 * 24 * 7) },
		{ label: '30 days', value: String(60 * 60 * 24 * 30) }
	];

	// Search runs 250ms after the last keystroke instead of on every one
	let searchInput = $state('');
	let searchQuery = $state('');
	$effect(() => {
		const value = searchInput.trim();
		const timer = setTimeout(() => (searchQuery = value), 250);
		return () => clearTimeout(timer);
	});

	const activeUserResponse = useQuery(api.users.queries.getActiveUser, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const activeUser = $derived(activeUserResponse?.data);

	const usersQuery = usePaginatedQuery(
		api.admin.queries.listUsers,
		() => ({ searchValue: searchQuery || undefined }),
		() => ({ initialNumItems: USERS_PAGE_SIZE, keepPreviousData: true })
	);
	const users = $derived(usersQuery.results);
	// While a new search loads, the previous results stay on screen, dimmed
	const isStale = $derived(usersQuery.status === 'LoadingFirstPage' && users.length > 0);

	// Dialog state
	let selectedUser = $state<AdminUser | null>(null);
	let banDialogOpen = $state(false);
	let deleteDialogOpen = $state(false);
	let passwordDialogOpen = $state(false);
	let banReason = $state('');
	let banExpiresIn = $state('');
	let newPassword = $state('');
	let submitting = $state(false);

	const isSelf = (user: AdminUser) => user.id === activeUser?._id;

	function openDialog(user: AdminUser, dialog: 'ban' | 'delete' | 'password') {
		selectedUser = user;
		banReason = '';
		banExpiresIn = '';
		newPassword = '';
		banDialogOpen = dialog === 'ban';
		deleteDialogOpen = dialog === 'delete';
		passwordDialogOpen = dialog === 'password';
	}

	function errorMessage(error: unknown, fallback: string): string {
		return error instanceof Error ? error.message : fallback;
	}

	function formatDate(epochMs: number): string {
		return new Date(epochMs).toLocaleDateString();
	}

	function banTitle(user: AdminUser): string {
		const until = user.banExpires ? `until ${new Date(user.banExpires).toLocaleString()}` : '';
		return ['Banned', until, user.banReason ? `: ${user.banReason}` : ''].join(' ').trim();
	}

	async function handleRoleChange(user: AdminUser, role: AppRole) {
		if (role === (user.isAppAdmin ? 'admin' : 'user')) return;
		try {
			await client.mutation(api.admin.mutations.setRole, { userId: user.id, role });
			toast.success(`${user.name} is now ${role === 'admin' ? 'an admin' : 'a user'}`);
		} catch (error) {
			toast.error(errorMessage(error, 'Failed to update role'));
		}
	}

	async function handleUnban(user: AdminUser) {
		try {
			await client.mutation(api.admin.mutations.unbanUser, { userId: user.id });
			toast.success(`Unbanned ${user.name}`);
		} catch (error) {
			toast.error(errorMessage(error, 'Failed to unban user'));
		}
	}

	async function handleRevokeSessions(user: AdminUser) {
		try {
			await client.mutation(api.admin.mutations.revokeUserSessions, { userId: user.id });
			toast.success(`Signed ${user.name} out everywhere`);
		} catch (error) {
			toast.error(errorMessage(error, 'Failed to revoke sessions'));
		}
	}

	async function handleImpersonate(user: AdminUser) {
		const { error } = await authClient.admin.impersonateUser({ userId: user.id });
		if (error) {
			toast.error(error.message ?? 'Failed to impersonate user');
			return;
		}
		// Refresh the Convex JWT cookie the server renders with, then reload so every query
		// runs as the impersonated user
		await authClient.getSession();
		window.location.assign(resolve('/'));
	}

	async function submitDialog(action: () => Promise<unknown>, success: string, failure: string) {
		submitting = true;
		try {
			await action();
			toast.success(success);
			banDialogOpen = false;
			deleteDialogOpen = false;
			passwordDialogOpen = false;
		} catch (error) {
			toast.error(errorMessage(error, failure));
		} finally {
			submitting = false;
		}
	}

	function handleBanSubmit(event: SubmitEvent) {
		event.preventDefault();
		const user = selectedUser;
		if (!user) return;
		void submitDialog(
			() =>
				client.mutation(api.admin.mutations.banUser, {
					userId: user.id,
					banReason: banReason.trim() || undefined,
					banExpiresIn: banExpiresIn ? Number(banExpiresIn) : undefined
				}),
			`Banned ${user.name}`,
			'Failed to ban user'
		);
	}

	function handlePasswordSubmit(event: SubmitEvent) {
		event.preventDefault();
		const user = selectedUser;
		if (!user) return;
		void submitDialog(
			() =>
				client.mutation(api.admin.mutations.setUserPassword, {
					userId: user.id,
					newPassword
				}),
			`Updated the password of ${user.name}`,
			'Failed to set password'
		);
	}

	function handleDeleteSubmit() {
		const user = selectedUser;
		if (!user) return;
		void submitDialog(
			() => client.mutation(api.admin.mutations.removeUser, { userId: user.id }),
			`Deleted ${user.name}`,
			'Failed to delete user'
		);
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-3 py-4">
		<div class="relative flex-1">
			<div class="pointer-events-none absolute inset-y-0 flex items-center">
				<SearchIcon class="text-surface-400-600 size-4" aria-hidden="true" />
			</div>
			<input
				type="search"
				class="input w-full !border-0 border-transparent pl-6 text-sm"
				placeholder="Search by name or email..."
				aria-label="Search users by name or email"
				bind:value={searchInput}
			/>
		</div>
		<CreateUser />
	</div>

	{#if usersQuery.error}
		<div class="text-error-600-400 p-4 text-sm">{usersQuery.error.message}</div>
	{:else if usersQuery.status === 'LoadingFirstPage' && users.length === 0}
		<div class="text-surface-600-400 flex items-center gap-2 p-4 text-sm" role="status">
			<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
			Loading users...
		</div>
	{:else if users.length === 0}
		<div class="text-surface-600-400 p-4 text-sm">
			{searchQuery ? `No users match "${searchQuery}".` : 'No users yet.'}
		</div>
	{:else}
		<div
			class="max-h-[calc(80vh-12rem)] overflow-y-auto pb-12 transition-opacity"
			class:opacity-60={isStale}
		>
			<table class="table w-full">
				<thead class="bg-surface-50-950 sticky top-0 z-20">
					<tr>
						<th class="text-surface-600-400 p-2 !pl-3 text-left text-xs font-semibold">User</th>
						<th class="text-surface-600-400 hidden p-2 text-left text-xs sm:table-cell">Email</th>
						<th class="text-surface-600-400 w-32 p-2 text-left text-xs">Role</th>
						<th class="text-surface-600-400 hidden w-28 p-2 text-left text-xs md:table-cell">
							Joined
						</th>
						<th class="w-12 p-2"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each users as user (user.id)}
						<tr class="!border-surface-300-700 !border-t">
							<td class="max-w-0 !py-3 !pl-3">
								<div class="flex items-center gap-2">
									<Avatar.Root class="size-8 shrink-0 sm:size-6">
										<Avatar.Image src={user.image ?? undefined} alt={user.name} />
										<Avatar.Fallback>
											<Avatar.Marble name={user.name} />
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex min-w-0 flex-col">
										<div class="flex min-w-0 items-center gap-2">
											<span class="truncate text-sm">{user.name}</span>
											{#if isSelf(user)}
												<span class="badge preset-tonal shrink-0">You</span>
											{/if}
											{#if user.banned}
												<span
													class="badge preset-filled-error-50-950 border-error-200-800 shrink-0 border"
													title={banTitle(user)}
												>
													Banned
												</span>
											{/if}
										</div>
										<span class="text-surface-700-300 truncate text-xs sm:hidden">{user.email}</span
										>
									</div>
								</div>
							</td>
							<td class="text-surface-600-400 hidden max-w-0 truncate text-sm sm:table-cell">
								{user.email}
							</td>
							<td>
								{#if isSelf(user) || user.isBootstrapAdmin}
									<span
										class="badge preset-filled-warning-50-950 border-warning-200-800 h-7 border px-2"
										title={user.isBootstrapAdmin
											? 'Admin through the ADMIN_USER_IDS environment variable'
											: "You can't change your own role"}
									>
										{user.isAppAdmin ? 'Admin' : 'User'}
									</span>
								{:else}
									<Select.Root
										collection={roleCollection}
										value={[user.isAppAdmin ? 'admin' : 'user']}
										onSelect={(details) => handleRoleChange(user, details.value as AppRole)}
									>
										<Select.Trigger class="w-full text-sm" aria-label={`Role of ${user.name}`} />
										<Portal>
											<Select.Content>
												{#each roleCollection.items as item (item.value)}
													<Select.Item {item}>
														<Select.ItemText>{item.label}</Select.ItemText>
														<Select.ItemIndicator>✓</Select.ItemIndicator>
													</Select.Item>
												{/each}
											</Select.Content>
										</Portal>
									</Select.Root>
								{/if}
							</td>
							<td class="text-surface-600-400 hidden text-sm md:table-cell">
								{formatDate(user.createdAt)}
							</td>
							<td class="text-right">
								{#if !isSelf(user) && !user.isAppAdmin}
									<Menu.Root>
										<Menu.Trigger
											class="btn-icon hover:preset-tonal"
											aria-label={`Actions for ${user.name}`}
										>
											<EllipsisVerticalIcon class="size-4" aria-hidden="true" />
										</Menu.Trigger>
										<Portal>
											<Menu.Content class="bg-surface-50-950">
												{#if !user.banned}
													<Menu.Item value="impersonate" onclick={() => handleImpersonate(user)}>
														Impersonate
													</Menu.Item>
												{/if}
												<Menu.Item value="password" onclick={() => openDialog(user, 'password')}>
													Set password
												</Menu.Item>
												<Menu.Item value="revoke" onclick={() => handleRevokeSessions(user)}>
													Sign out everywhere
												</Menu.Item>
												{#if user.banned}
													<Menu.Item value="unban" onclick={() => handleUnban(user)}
														>Unban</Menu.Item
													>
												{:else}
													<Menu.Item value="ban" onclick={() => openDialog(user, 'ban')}
														>Ban</Menu.Item
													>
												{/if}
												<Menu.Item
													value="delete"
													variant="destructive"
													onclick={() => openDialog(user, 'delete')}
												>
													Delete
												</Menu.Item>
											</Menu.Content>
										</Portal>
									</Menu.Root>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if searchQuery && !isStale && users.length >= USERS_PAGE_SIZE}
				<p class="text-surface-600-400 py-3 text-center text-xs">
					Showing the first {USERS_PAGE_SIZE} matches. Refine your search to narrow them down.
				</p>
			{/if}
			{#if usersQuery.status === 'CanLoadMore' || usersQuery.status === 'LoadingMore'}
				<div class="flex justify-center py-3">
					<button
						type="button"
						class="btn preset-tonal"
						onclick={() => usersQuery.loadMore(USERS_PAGE_SIZE)}
						disabled={usersQuery.status === 'LoadingMore'}
					>
						Load more
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Ban dialog -->
	<Dialog.Root bind:open={banDialogOpen}>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Ban {selectedUser?.name}</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					They are signed out everywhere and can't sign in until the ban ends or you lift it.
				</Dialog.Description>
			</Dialog.Header>
			<form id="admin-ban-user" class="flex w-full flex-col gap-3" onsubmit={handleBanSubmit}>
				<label class="label">
					<span class="label-text">Reason (optional)</span>
					<input
						type="text"
						class="input"
						bind:value={banReason}
						placeholder="Violation of terms"
					/>
				</label>
				<label class="label">
					<span class="label-text">Duration</span>
					<select class="select" bind:value={banExpiresIn}>
						{#each banDurations as duration (duration.value)}
							<option value={duration.value}>{duration.label}</option>
						{/each}
					</select>
				</label>
			</form>
			<Dialog.Footer>
				<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
				<button
					type="submit"
					form="admin-ban-user"
					class="btn preset-filled-error-500"
					disabled={submitting}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Banning...
					{:else}
						Ban user
					{/if}
				</button>
			</Dialog.Footer>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>

	<!-- Set password dialog -->
	<Dialog.Root bind:open={passwordDialogOpen}>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Set password for {selectedUser?.name}</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					If they sign in without a password today, they can also use their email and this password
					from now on. Their existing sessions stay signed in.
				</Dialog.Description>
			</Dialog.Header>
			<form id="admin-set-password" class="w-full" onsubmit={handlePasswordSubmit}>
				<label class="label">
					<span class="label-text">New password</span>
					<Password.Root minScore={0}>
						<Password.Input
							bind:value={newPassword}
							autocomplete="new-password"
							minlength={8}
							required
						>
							<Password.ToggleVisibility />
						</Password.Input>
					</Password.Root>
				</label>
			</form>
			<Dialog.Footer>
				<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
				<button
					type="submit"
					form="admin-set-password"
					class="btn preset-filled-primary-500"
					disabled={submitting}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Saving...
					{:else}
						Set password
					{/if}
				</button>
			</Dialog.Footer>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>

	<!-- Delete dialog -->
	<Dialog.Root bind:open={deleteDialogOpen}>
		<Dialog.Content class="md:max-w-108">
			<Dialog.Header>
				<Dialog.Title>Delete {selectedUser?.name}</Dialog.Title>
				<Dialog.Description class="text-surface-700-300">
					This permanently deletes the account, its sessions and its organization memberships. If
					they own an organization with other members, delete it or make someone else its owner
					first. This can't be undone.
				</Dialog.Description>
			</Dialog.Header>
			<Dialog.Footer>
				<Dialog.Close class="btn preset-tonal" disabled={submitting}>Cancel</Dialog.Close>
				<button
					type="button"
					class="btn preset-filled-error-500"
					onclick={handleDeleteSubmit}
					disabled={submitting}
					aria-busy={submitting}
				>
					{#if submitting}
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Deleting...
					{:else}
						Delete user
					{/if}
				</button>
			</Dialog.Footer>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
</div>
