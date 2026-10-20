<script lang="ts">
	// Primitives
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	// Icons
	import SearchIcon from '@lucide/svelte/icons/search';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	// Components
	import CreateUser from '#lib/admin/ui/CreateUser.svelte';
	import UserActionsMenu from '#lib/admin/ui/UserActionsMenu.svelte';
	import UserDialogs from '#lib/admin/ui/UserDialogs.svelte';
	// API
	import { useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	// Constants
	import { LIST_MAX, USERS_PAGE_SIZE } from '#lib/admin/utils/admin.constants.js';
	// Types
	import type { AdminUser, UserDialog } from '#lib/admin/types.js';

	let {
		onViewProfile
	}: {
		/** Opens the profile of a user */
		onViewProfile: (userId: string) => void;
	} = $props();

	const { api } = getAuthContext();
	const auth = useAuth();

	// Search runs 250ms after the last keystroke instead of on every one
	let searchInput = $state('');
	let searchQuery = $state('');
	let limit = $state(USERS_PAGE_SIZE);
	$effect(() => {
		const value = searchInput.trim();
		const timer = setTimeout(() => {
			searchQuery = value;
			limit = USERS_PAGE_SIZE;
		}, 250);
		return () => clearTimeout(timer);
	});

	const activeUserResponse = useQuery(api.users.queries.getActiveUser, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const activeUser = $derived(activeUserResponse?.data);

	// "Load more" raises the limit of one reactive list instead of adding cursor pages, so users
	// created or deleted meanwhile can't show twice or drop out
	const usersQuery = useQuery(
		api.admin.queries.listUsers,
		() => ({ searchValue: searchQuery || undefined, limit }),
		{ keepPreviousData: true }
	);
	const users = $derived(usersQuery.data?.users ?? []);
	// While a new search or page loads, the previous results stay on screen, dimmed
	const isStale = $derived(usersQuery.isStale);

	let selectedUser = $state<AdminUser | null>(null);
	let dialog = $state<UserDialog | null>(null);

	const isSelf = (user: AdminUser) => user.id === activeUser?._id;

	function openDialog(user: AdminUser, next: UserDialog) {
		selectedUser = user;
		dialog = next;
	}

	function formatDate(epochMs: number): string {
		return new Date(epochMs).toLocaleDateString();
	}

	function banTitle(user: AdminUser): string {
		const until = user.banExpires ? `until ${new Date(user.banExpires).toLocaleString()}` : '';
		return ['Banned', until, user.banReason ? `: ${user.banReason}` : ''].join(' ').trim();
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
	{:else if !usersQuery.data}
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
						<th class="text-surface-600-400 hidden w-32 p-2 text-left text-xs sm:table-cell">
							Joined
						</th>
						<th class="w-12 p-2"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each users as user (user.id)}
						<tr
							class="!border-surface-300-700 hover:bg-surface-100-900 cursor-pointer !border-t"
							onclick={() => onViewProfile(user.id)}
						>
							<td class="max-w-0 !py-3 !pl-3">
								<div class="flex items-center gap-3">
									<Avatar.Root class="size-9 shrink-0">
										<Avatar.Image src={user.image ?? undefined} alt={user.name} />
										<Avatar.Fallback>
											<Avatar.Marble name={user.name} />
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex min-w-0 flex-col">
										<div class="flex min-w-0 items-center gap-2">
											<!-- The keyboard way to the profile; the row handles pointer clicks -->
											<button
												type="button"
												class="truncate text-left text-sm font-medium hover:underline"
												data-admin-focus={user.id}
												onclick={(event) => {
													event.stopPropagation();
													onViewProfile(user.id);
												}}
											>
												{user.name}
											</button>
											{#if isSelf(user)}
												<span class="badge preset-tonal shrink-0">You</span>
											{/if}
											{#if user.isAppAdmin}
												<span
													class="badge preset-filled-warning-50-950 border-warning-200-800 shrink-0 border"
													title={user.isBootstrapAdmin
														? 'Admin through the ADMIN_USER_IDS environment variable'
														: undefined}
												>
													Admin
												</span>
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
										<span class="text-surface-600-400 truncate text-sm">{user.email}</span>
									</div>
								</div>
							</td>
							<td class="text-surface-600-400 hidden text-sm sm:table-cell">
								{formatDate(user.createdAt)}
							</td>
							<!-- Clicks on the menu don't open the profile -->
							<td class="text-right" onclick={(event) => event.stopPropagation()}>
								<UserActionsMenu
									{user}
									isSelf={isSelf(user)}
									onDialog={(next) => openDialog(user, next)}
									onViewProfile={() => onViewProfile(user.id)}
								/>
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
			{#if usersQuery.data.hasMore && limit >= LIST_MAX}
				<p class="text-surface-600-400 py-3 text-center text-xs">
					Showing the newest {LIST_MAX} users. Search to find the others.
				</p>
			{:else if usersQuery.data.hasMore}
				<div class="flex justify-center py-3">
					<button
						type="button"
						class="btn preset-tonal"
						onclick={() => (limit = Math.min(limit + USERS_PAGE_SIZE, LIST_MAX))}
						disabled={isStale}
					>
						Load more
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<UserDialogs user={selectedUser} bind:dialog />
</div>
