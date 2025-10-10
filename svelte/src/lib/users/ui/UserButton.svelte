<script lang="ts">
	// Primitives
	import * as Popover from '$lib/primitives/ui/popover';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	// Icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	// Components
	import SignIn from '$lib/auth/ui/SignIn.svelte';
	import SignOutButton from '$lib/auth/ui/SignOutButton.svelte';

	// SvelteKit navigation/state
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// API
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useQuery } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	// Constants
	import { DIALOG_KEY } from '$lib/users/utils/user.constants';

	// Types
	import type { PopoverRootProps } from '@ark-ui/svelte';
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;

	// Props
	const {
		popoverPlacement = 'bottom',
		initialData
	}: {
		popoverPlacement?: NonNullable<PopoverRootProps['positioning']>['placement'];
		initialData?: {
			activeUser?: GetActiveUserType;
			accountList?: ListAccountsType;
		};
	} = $props();

	// Auth
	const auth = useAuth();
	const isLoading = $derived(auth.isLoading);
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries
	const activeUserResponse = $derived(
		isAuthenticated
			? useQuery(api.users.queries.getActiveUser, {}, { initialData: initialData?.activeUser })
			: undefined
	);
	// Derived state - prefer initialData over empty query results during auth sync
	const activeUser = $derived(activeUserResponse?.data ?? initialData?.activeUser);

	// State
	let userPopoverOpen = $state(false);
	let signInDialogOpen = $state(false);
	let avatarStatus = $state('');

	// Ensure SignIn form resets every time the dialog opens
	let signInKey = $state(0);
	let prevSignInDialogOpen = false;

	/**
	 * Open profile modal and close popover (via shallow routing)
	 */
	function openProfileModal(): void {
		userPopoverOpen = false;
		const url = new URL(page.url);
		if (url.searchParams.get('dialog') !== DIALOG_KEY) {
			url.searchParams.set('dialog', DIALOG_KEY);
			goto(`${url.pathname}${url.search}${url.hash}`, {
				replaceState: false,
				noScroll: true,
				keepFocus: true
			});
		}
	}

	// Bump key when dialog transitions from closed -> open to remount SignIn
	$effect(() => {
		if (signInDialogOpen && !prevSignInDialogOpen) {
			signInKey += 1;
		}
		prevSignInDialogOpen = signInDialogOpen;
	});
</script>

{#if initialData?.activeUser || (isAuthenticated && activeUser)}
	<Popover.Root
		bind:open={userPopoverOpen}
		positioning={{
			placement: popoverPlacement,
			strategy: 'absolute',
			offset: { mainAxis: 8, crossAxis: 0 }
		}}
	>
		<Popover.Trigger>
			<Avatar.Root
				class="ring-surface-100-900 size-9 ring-0 duration-200 ease-out hover:ring-4"
				onStatusChange={(details) => (avatarStatus = details.status)}
			>
				<Avatar.Image src={activeUser?.image} alt={activeUser?.name} />
				<Avatar.Fallback>
					{#if avatarStatus === 'loading'}
						<div class="placeholder-circle size-10 animate-pulse"></div>
					{:else}
						<Avatar.Marble name={activeUser?.name} />
					{/if}
				</Avatar.Fallback>
			</Avatar.Root>
		</Popover.Trigger>
		<Popover.Content>
			<div class="flex flex-col gap-1 p-0">
				<button
					class="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex flex-row items-center gap-4 p-3 pr-6 duration-200 ease-in-out"
					onclick={openProfileModal}
				>
					<Avatar.Root class="size-12">
						<Avatar.Image src={activeUser?.image} alt={activeUser?.name} />
						<Avatar.Fallback>
							<Avatar.Marble name={activeUser?.name} />
						</Avatar.Fallback>
					</Avatar.Root>
					<div class="flex flex-1 flex-col gap-0 overflow-hidden">
						<p class="truncate text-left text-sm font-medium">{activeUser?.name}</p>
						<p class="truncate text-left text-xs opacity-75">
							{activeUser?.email}
						</p>
					</div>
					<ChevronRightIcon class="size-4" />
				</button>
				<SignOutButton
					onSuccess={() => (userPopoverOpen = false)}
					class="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
				/>
			</div>
		</Popover.Content>
	</Popover.Root>
{:else if isLoading}
	<div class="placeholder-circle size-10 animate-pulse"></div>
{:else}
	<button class="btn preset-filled-primary-500" onclick={() => (signInDialogOpen = true)}>
		Sign in
	</button>
{/if}
<!-- SignIn Dialog - Outside of auth wrappers to prevent disappearing during registration -->
<Dialog.Root
	bind:open={signInDialogOpen}
	onOpenChange={(status) => {
		// When dialog closes, bump the key so next open is a fresh mount
		if (!status.open) {
			signInKey += 1;
		}
	}}
>
	<Dialog.Content
		class="sm:rounded-container h-full max-h-[100dvh] w-full rounded-none sm:h-auto sm:max-h-[90vh] sm:w-4xl sm:max-w-md"
	>
		{#key signInKey}
			<SignIn onSignIn={() => (signInDialogOpen = false)} class="p-2 sm:p-8" />
		{/key}
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>
