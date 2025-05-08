<script lang="ts">
	import { useAuth } from '@convex-dev/auth/sveltekit';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { Popover, Modal, Avatar } from '@skeletonlabs/skeleton-svelte';
	import ChevronRight from 'lucide-svelte/icons/chevron-right';
	import UserProfile from '$lib/users/ui/UserProfile.svelte';

	// Types
	import type { ComponentProps } from 'svelte';
	import { X } from 'lucide-svelte';
	type PopoverProps = ComponentProps<typeof Popover>;
	type PlacementType = NonNullable<PopoverProps['positioning']>['placement'];

	const props: { popoverPlacement?: PlacementType } = $props();
	// Default to 'bottom-end' if no placement provided
	const popoverPlacement = props.popoverPlacement || 'bottom-end';

	// State
	let popoverOpen: boolean = $state(false);
	let profileModalOpen: boolean = $state(false);

	// Auth
	const { signOut } = useAuth();
	const isAuthenticated = $derived(useAuth().isAuthenticated);

	$inspect('isAuthenticated: ', isAuthenticated);

	// User data from Convex
	const { data: user } = useQuery(api.users.getUser, {});

	/**
	 * Open profile modal and close popover
	 */
	function openProfileModal(): void {
		popoverOpen = false;
		profileModalOpen = true;
	}
</script>

{#if isAuthenticated}
	{#if user}
		<!-- User Popover -->
		<Popover
			open={popoverOpen}
			onOpenChange={(e) => (popoverOpen = e.open)}
			positioning={{ placement: popoverPlacement }}
			contentBase="p-1 bg-surface-200-800 rounded-xl w-80 transition-all duration-300 ease-in-out"
		>
			{#snippet trigger()}
				<Avatar
					src={user.image}
					name={user.name}
					size="size-10 ring-0 hover:ring-4 ring-surface-100-900 ease-out duration-200"
				/>
			{/snippet}

			{#snippet content()}
				<div class="flex flex-col gap-1 p-0">
					<button
						class="bg-surface-50-950 flex flex-row items-center gap-3 rounded-lg p-3 pr-6 duration-200 ease-in-out"
						onclick={openProfileModal}
					>
						<Avatar src={user.image} name={user.name} size="size-12" />
						<div class="flex flex-1 flex-col gap-0 overflow-hidden">
							<p class="truncate text-left text-base font-medium">{user.name}</p>
							<p class="text-surface-700-300 truncate text-left text-xs">{user.email}</p>
						</div>
						<ChevronRight class="size-4" />
					</button>
					<button
						class="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
						onclick={() => signOut()}
					>
						Sign out
					</button>
				</div>
			{/snippet}
		</Popover>

		<!-- Profile Modal -->
		<Modal
			open={profileModalOpen}
			onOpenChange={(e) => (profileModalOpen = e.open)}
			contentBase="bg-surface-200-800 relative rounded-xl p-1"
		>
			{#snippet content()}
				<div class="flex items-center justify-between p-0">
					<UserProfile />
					<button
						class="btn-icon btn-icon-sm preset-tonal absolute top-2 right-2 rounded-full"
						onclick={() => (profileModalOpen = false)}
						aria-label="Close"
					>
						<X />
					</button>
				</div>
			{/snippet}
		</Modal>
	{:else}
		<div class="placeholder-circle size-10 animate-pulse"></div>
	{/if}
{:else}
	<a href="/login" class="btn preset-filled-primary-500">Sign in </a>
{/if}
