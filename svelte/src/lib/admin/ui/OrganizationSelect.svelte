<script lang="ts">
	// Primitives
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	// Icons
	import CheckIcon from '@lucide/svelte/icons/check';
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import SearchIcon from '@lucide/svelte/icons/search';
	// API
	import { useQuery } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	// Types
	import type { AdminOrganization } from '#lib/admin/types.js';

	let {
		value = $bindable(null),
		excludeIds = [],
		id
	}: {
		/** The selected organization */
		value: AdminOrganization | null;
		/** Organizations not to offer, like those the user already belongs to */
		excludeIds?: string[];
		/** Id of the trigger, for a `<label for>` */
		id?: string;
	} = $props();

	const { api } = getAuthContext();
	const listId = $props.id();

	// The list expands inline rather than in a popover: dialogs hide portaled content from
	// screen readers and clip content that isn't portaled
	let expanded = $state(false);
	let searchInput = $state('');
	let search = $state('');
	// Search runs 200ms after the last keystroke instead of on every one
	$effect(() => {
		const next = searchInput.trim();
		const timer = setTimeout(() => (search = next), 200);
		return () => clearTimeout(timer);
	});

	const results = useQuery(
		api.admin.queries.searchOrganizations,
		() => (expanded ? { search: search || undefined } : 'skip'),
		{ keepPreviousData: true }
	);
	const organizations = $derived(
		(results.data ?? []).filter((organization) => !excludeIds.includes(organization._id))
	);

	function toggle() {
		expanded = !expanded;
		if (expanded) {
			searchInput = '';
			search = '';
		}
	}

	function select(organization: AdminOrganization) {
		value = organization;
		expanded = false;
	}

	function focusOnMount(node: HTMLInputElement) {
		node.focus();
	}
</script>

{#snippet organizationLabel(organization: AdminOrganization)}
	<Avatar.Root class="rounded-container size-8 shrink-0">
		<Avatar.Image src={organization.logo ?? undefined} alt={organization.name} />
		<Avatar.Fallback class="rounded-container">
			<Avatar.Marble name={organization.name} />
		</Avatar.Fallback>
	</Avatar.Root>
	<span class="flex min-w-0 flex-1 flex-col text-left">
		<span class="truncate text-sm">{organization.name}</span>
		<span class="text-surface-600-400 truncate text-xs">{organization.slug}</span>
	</span>
{/snippet}

<div class="flex flex-col gap-1">
	<button
		{id}
		type="button"
		class="input flex min-h-12 w-full cursor-pointer items-center gap-3 py-2 text-left"
		aria-expanded={expanded}
		aria-controls={listId}
		onclick={toggle}
	>
		{#if value}
			{@render organizationLabel(value)}
		{:else}
			<span class="text-surface-600-400 flex-1 text-sm">Select an organization...</span>
		{/if}
		<ChevronDownIcon
			class="size-4 shrink-0 opacity-60 transition-transform {expanded ? 'rotate-180' : ''}"
			aria-hidden="true"
		/>
	</button>
	{#if expanded}
		<div
			id={listId}
			class="border-surface-300-700 rounded-container flex flex-col gap-1 border p-1"
		>
			<div class="relative">
				<SearchIcon
					class="text-surface-400-600 pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
					aria-hidden="true"
				/>
				<input
					type="search"
					class="input pl-9 text-sm"
					placeholder="Search organizations..."
					aria-label="Search organizations"
					bind:value={searchInput}
					use:focusOnMount
					onkeydown={(event) => {
						// Enter would submit the dialog's form with the previous selection
						if (event.key === 'Enter') event.preventDefault();
					}}
				/>
			</div>
			<div class="flex max-h-56 flex-col overflow-y-auto">
				{#if results.error}
					<p class="text-error-600-400 p-3 text-sm">{results.error.message}</p>
				{:else if !results.data}
					<p class="text-surface-600-400 flex items-center gap-2 p-3 text-sm" role="status">
						<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
						Loading organizations...
					</p>
				{:else if organizations.length === 0}
					<p class="text-surface-600-400 p-3 text-sm">
						{search ? `No organizations match "${search}".` : 'No organizations to add.'}
					</p>
				{:else}
					{#each organizations as organization (organization._id)}
						<button
							type="button"
							class="hover:bg-surface-200-800 focus-visible:bg-surface-200-800 rounded-base flex items-center gap-3 p-2 outline-hidden"
							class:opacity-60={results.isStale}
							aria-pressed={value?._id === organization._id}
							onclick={() => select(organization)}
						>
							{@render organizationLabel(organization)}
							{#if value?._id === organization._id}
								<CheckIcon class="size-4 shrink-0" aria-hidden="true" />
							{/if}
						</button>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>
