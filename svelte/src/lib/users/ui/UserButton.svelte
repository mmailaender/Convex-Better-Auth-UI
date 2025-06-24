<script lang="ts">
	// Primitives
	import * as Popover from '$lib/primitives/ui/popover';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import AvatarMarble from '$lib/primitives/ui/avatar-fallback';
	// Icons
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	// Components
	import UserProfile from '$lib/users/ui/UserProfile.svelte';

	// API
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	// Types
	import type { ComponentProps } from 'svelte';
	type PopoverProps = ComponentProps<typeof Popover.Content>;
	import type { FunctionReturnType } from 'convex/server';
	import SignIn from '$lib/auth/ui/SignIn.svelte';
	type UserResponse = FunctionReturnType<typeof api.users.queries.getUser>;

	// Props
	const {
		popoverSide = 'bottom',
		popoverAlign = 'end',
		initialData
	}: {
		popoverSide?: PopoverProps['side'];
		popoverAlign?: PopoverProps['align'];
		initialData?: UserResponse;
	} = $props();

	// State
	let userPopoverOpen = $state(false);
	let profileDialogOpen = $state(false);

	// Auth
	const { signOut } = useAuth();
	const isAuthenticated = $derived(useAuth().isAuthenticated);

	// Queries
	const userResponse = useQuery(api.users.queries.getUser, {}, { initialData });
	const user = $derived(userResponse.data);

	/**
	 * Open profile modal and close popover
	 */
	function openProfileModal(): void {
		userPopoverOpen = false;
		profileDialogOpen = true;
	}
</script>

{#if isAuthenticated}
	{#if user}
		<!-- User Popover -->
		<Popover.Root bind:open={userPopoverOpen}>
			<Popover.Trigger>
				<Avatar
					src={user.image}
					name={user.name}
					size="size-10 ring-0 hover:ring-4 ring-surface-100-900 ease-out duration-200"
				>
					<AvatarMarble name={user.name} />
				</Avatar>
			</Popover.Trigger>

			<Popover.Content side={popoverSide} align={popoverAlign}>
				<div class="flex flex-col gap-1 p-0">
					<button
						class="bg-surface-50-950 hover:bg-surface-100-900 rounded-base flex flex-row items-center gap-3 p-3 pr-6 duration-200 ease-in-out"
						onclick={openProfileModal}
					>
						<Avatar src={user.image} name={user.name} size="size-12">
							<AvatarMarble name={user.name} />
						</Avatar>
						<div class="flex flex-1 flex-col gap-0 overflow-hidden">
							<p class="truncate text-left text-base font-medium">{user.name}</p>
							<p class="text-surface-700-300 truncate text-left text-xs">
								{user.email}
							</p>
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
			</Popover.Content>
		</Popover.Root>

		<!-- Profile Dialog -->
		<Dialog.Root bind:open={profileDialogOpen}>
			<Dialog.Content class="max-w-xl">
				<Dialog.Header>
					<Dialog.Title>Profile</Dialog.Title>
				</Dialog.Header>
				<UserProfile />
				<Dialog.CloseX />
			</Dialog.Content>
		</Dialog.Root>
	{:else}
		<div class="placeholder-circle size-10 animate-pulse"></div>
	{/if}
{:else}
	<Dialog.Root>
		<Dialog.Trigger class="btn preset-filled-primary-500">Sign in</Dialog.Trigger>
		<Dialog.Content
			class="sm:rounded-container h-full w-full rounded-none sm:h-auto sm:w-4xl sm:max-w-md"
		>
			<Dialog.Header>
				<Dialog.Title>Sign in</Dialog.Title>
			</Dialog.Header>
			<SignIn />
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{/if}
