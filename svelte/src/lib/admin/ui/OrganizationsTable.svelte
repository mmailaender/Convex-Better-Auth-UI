<script lang="ts">
	// Primitives
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	// Icons
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	// Components
	import OrganizationActionsMenu from '#lib/admin/ui/OrganizationActionsMenu.svelte';
	// API
	import { useQuery } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	// Constants
	import { LIST_MAX } from '#lib/admin/utils/admin.constants.js';

	let {
		onViewOrganization
	}: {
		/** Opens the page of an organization */
		onViewOrganization: (organizationId: string) => void;
	} = $props();

	const PAGE_SIZE = 25;

	const { api } = getAuthContext();

	// Search runs 250ms after the last keystroke instead of on every one, like the users table
	let searchInput = $state('');
	let searchQuery = $state('');
	let limit = $state(PAGE_SIZE);
	$effect(() => {
		const value = searchInput.trim();
		const timer = setTimeout(() => {
			searchQuery = value;
			limit = PAGE_SIZE;
		}, 250);
		return () => clearTimeout(timer);
	});

	// "Load more" raises the limit of one reactive list, like the users table
	const orgsQuery = useQuery(
		api.admin.queries.listAllOrganizations,
		() => ({ searchValue: searchQuery || undefined, limit }),
		{ keepPreviousData: true }
	);
	const organizations = $derived(orgsQuery.data?.organizations ?? []);
	// While a new search or page loads, the previous results stay on screen, dimmed
	const isStale = $derived(orgsQuery.isStale);
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
				placeholder="Search by name or slug..."
				aria-label="Search organizations by name or slug"
				bind:value={searchInput}
			/>
		</div>
	</div>

	{#if orgsQuery.error}
		<div class="text-error-600-400 p-4 text-sm">{orgsQuery.error.message}</div>
	{:else if !orgsQuery.data}
		<div class="text-surface-600-400 flex items-center gap-2 p-4 text-sm" role="status">
			<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
			Loading organizations...
		</div>
	{:else if organizations.length === 0}
		<div class="text-surface-600-400 p-4 text-sm">
			{searchQuery ? `No organizations match "${searchQuery}".` : 'No organizations yet.'}
		</div>
	{:else}
		<div
			class="max-h-[calc(80vh-12rem)] overflow-y-auto pb-12 transition-opacity"
			class:opacity-60={isStale}
		>
			<table class="table w-full">
				<thead class="bg-surface-50-950 sticky top-0 z-20">
					<tr>
						<th class="text-surface-600-400 p-2 !pl-3 text-left text-xs font-semibold">
							Organization
						</th>
						<th class="text-surface-600-400 hidden w-32 p-2 text-left text-xs sm:table-cell">
							Created
						</th>
						<th class="w-12 p-2"><span class="sr-only">Actions</span></th>
					</tr>
				</thead>
				<tbody>
					{#each organizations as org (org._id)}
						<tr
							class="!border-surface-300-700 hover:bg-surface-100-900 cursor-pointer !border-t"
							onclick={() => onViewOrganization(org._id)}
						>
							<td class="max-w-0 !py-3 !pl-3">
								<div class="flex items-center gap-3">
									<Avatar.Root class="rounded-container size-9 shrink-0">
										<Avatar.Image src={org.logo ?? undefined} alt={org.name} />
										<Avatar.Fallback class="rounded-container">
											<Avatar.Marble name={org.name} />
										</Avatar.Fallback>
									</Avatar.Root>
									<div class="flex min-w-0 flex-col">
										<!-- The keyboard way to the organization; the row handles pointer clicks -->
										<button
											type="button"
											class="truncate text-left text-sm font-medium hover:underline"
											data-admin-focus={org._id}
											onclick={(event) => {
												event.stopPropagation();
												onViewOrganization(org._id);
											}}
										>
											{org.name}
										</button>
										<span class="text-surface-600-400 truncate text-sm">{org.slug}</span>
									</div>
								</div>
							</td>
							<td class="text-surface-600-400 hidden text-sm sm:table-cell">
								{new Date(org.createdAt).toLocaleDateString()}
							</td>
							<!-- Clicks on the menu don't open the organization -->
							<td class="text-right" onclick={(event) => event.stopPropagation()}>
								<OrganizationActionsMenu
									organization={org}
									onView={() => onViewOrganization(org._id)}
								/>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			{#if searchQuery && !isStale && organizations.length >= PAGE_SIZE}
				<p class="text-surface-600-400 py-3 text-center text-xs">
					Showing the first {PAGE_SIZE} matches. Refine your search to narrow them down.
				</p>
			{/if}
			{#if orgsQuery.data.hasMore && limit >= LIST_MAX}
				<p class="text-surface-600-400 py-3 text-center text-xs">
					Showing the newest {LIST_MAX} organizations. Search to find the others.
				</p>
			{:else if orgsQuery.data.hasMore}
				<div class="flex justify-center py-3">
					<button
						type="button"
						class="btn preset-tonal"
						onclick={() => (limit = Math.min(limit + PAGE_SIZE, LIST_MAX))}
						disabled={isStale}
					>
						Load more
					</button>
				</div>
			{/if}
		</div>
	{/if}
</div>
