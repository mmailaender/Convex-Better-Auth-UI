<script lang="ts">
	// Primitives
	import * as Popover from '$lib/primitives/ui/popover';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	// Icons
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	// Components
	import UserProfile from '$lib/users/ui/UserProfile.svelte';
	import SignIn from '$lib/auth/ui/SignIn.svelte';
	import SignOutButton from '$lib/auth/ui/SignOutButton.svelte';

	// API
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	// Types
	import type { PopoverRootProps } from '@ark-ui/svelte';
	import type { FunctionReturnType } from 'convex/server';
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	// Props
	const {
		popoverPlacement = 'bottom',
		initialData
	}: {
		popoverPlacement?: NonNullable<PopoverRootProps['positioning']>['placement'];
		initialData?: UserResponse;
	} = $props();

	// Auth
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries
	const userResponse = useQuery(api.users.queries.getActiveUser, {}, { initialData });
	const user = $derived(userResponse.data);

	// State
	let userPopoverOpen = $state(false);
	let profileDialogOpen = $state(false);
	let signInDialogOpen = $state(false);

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
		<Popover.Root
			bind:open={userPopoverOpen}
			positioning={{
				placement: popoverPlacement,
				strategy: 'absolute',
				offset: { mainAxis: 8, crossAxis: 0 }
			}}
		>
			<Popover.Trigger>
				<Avatar.Root class="ring-surface-100-900 size-10 ring-0 duration-200 ease-out hover:ring-4">
					<Avatar.Image src={user.image} alt={user.name} />
					<Avatar.Fallback>
						<Avatar.Marble name={user.name} />
					</Avatar.Fallback>
				</Avatar.Root>
			</Popover.Trigger>
			<Popover.Content>
				<div class="flex flex-col gap-1 p-0">
					<button
						class="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex flex-row items-center gap-3 p-3 pr-6 duration-200 ease-in-out"
						onclick={openProfileModal}
					>
						<Avatar.Root class="size-12">
							<Avatar.Image src={user.image} alt={user.name} />
							<Avatar.Fallback>
								<Avatar.Marble name={user.name} />
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="flex flex-1 flex-col gap-0 overflow-hidden">
							<p class="truncate text-left text-base font-medium">{user.name}</p>
							<p class="text-surface-700-300 truncate text-left text-xs">
								{user.email}
							</p>
						</div>
						<ChevronRight class="size-4" />
					</button>
					<SignOutButton
						onSuccess={() => (userPopoverOpen = false)}
						class="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
					/>
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
	<button class="btn preset-filled-primary-500" onclick={() => (signInDialogOpen = true)}>
		Sign in
	</button>
{/if}

<!-- SignIn Dialog - Outside of auth wrappers to prevent disappearing during registration -->
<Dialog.Root bind:open={signInDialogOpen}>
	<Dialog.Content
		class="sm:rounded-container h-full w-full rounded-none sm:h-auto sm:w-4xl sm:max-w-md"
	>
		<Dialog.Header>
			<Dialog.Title>Sign in</Dialog.Title>
		</Dialog.Header>
		<SignIn onSignIn={() => (signInDialogOpen = false)} />
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>
