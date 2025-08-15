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

	// SvelteKit navigation/state
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

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
	const isLoading = $derived(auth.isLoading);
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries
	const userResponse = useQuery(api.users.queries.getActiveUser, {}, { initialData });
	const user = $derived(userResponse.data);

	// State
	let userPopoverOpen = $state(false);
	let profileDialogOpen = $state(false);
	let signInDialogOpen = $state(false);
	let avatarStatus = $state('');
	// Track lifecycle and previous open state
	let mounted = $state(false);
	let prevProfileDialogOpen = $state(false);
	// Guard to avoid reopening from URL while we're removing the param during a UI close
	let closingViaUI = $state(false);

	onMount(() => {
		mounted = true;
	});

	// Opening is driven explicitly via openProfileModal() pushing the URL param.

	/**
	 * Reflect dialog CLOSE to URL.
	 * When the dialog transitions from open -> closed and the param exists,
	 * remove the param via shallow replace; set a guard to avoid immediate reopen.
	 */
	$effect(() => {
		const has = page.url.searchParams.get('dialog') === 'user-profile';
		if (mounted && prevProfileDialogOpen && !profileDialogOpen && has) {
			closingViaUI = true;
			const url = new URL(page.url);
			url.searchParams.delete('dialog');
			const path = `${url.pathname}${url.search}${url.hash}`;
			void goto(path, {
				replaceState: true,
				noScroll: true,
				keepFocus: true,
				invalidateAll: false
			});
		}
		prevProfileDialogOpen = profileDialogOpen;
	});

	/**
	 * Source of truth: URL -> profileDialogOpen.
	 * Open dialog when ?dialog=user-profile is present. Close when removed.
	 * While closingViaUI is true, ignore URL->state until the URL reflects the change.
	 */
	$effect(() => {
		const has = page.url.searchParams.get('dialog') === 'user-profile';
		if (closingViaUI) {
			if (!has) closingViaUI = false;
			return;
		}
		if (has !== profileDialogOpen) {
			profileDialogOpen = has;
		}
	});

	// URL is the single source of truth; no state->URL/URL->state effects are needed.

	/**
	 * Open profile modal and close popover (via shallow routing)
	 */
	function openProfileModal(): void {
		userPopoverOpen = false;
		const has = page.url.searchParams.get('dialog') === 'user-profile';
		if (!has) {
			const url = new URL(page.url);
			url.searchParams.set('dialog', 'user-profile');
			const path = `${url.pathname}${url.search}${url.hash}`;
			void goto(path, {
				replaceState: false,
				noScroll: true,
				keepFocus: true,
				invalidateAll: false
			});
		}
	}
</script>

{#if isLoading}
	<div class="placeholder-circle size-10 animate-pulse"></div>
{:else if isAuthenticated}
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
				<Avatar.Root
					class="ring-surface-100-900 size-10 ring-0 duration-200 ease-out hover:ring-4"
					onStatusChange={(details) => (avatarStatus = details.status)}
				>
					<Avatar.Image src={user.image} alt={user.name} />
					<Avatar.Fallback>
						{#if avatarStatus === 'loading'}
							<div class="placeholder-circle size-10 animate-pulse"></div>
						{:else}
							<Avatar.Marble name={user.name} />
						{/if}
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
			<Dialog.Content
				class="md:rounded-container top-0 left-0 h-full max-h-[100dvh]
		       w-full max-w-full translate-x-0 translate-y-0 rounded-none md:top-[50%]
		       md:left-[50%] md:h-auto md:max-h-[80vh] md:w-auto
		       md:max-w-xl md:translate-x-[-50%] md:translate-y-[-50%]"
			>
				<Dialog.Header>
					<Dialog.Title>Profile</Dialog.Title>
				</Dialog.Header>
				<div
					class="max-h-[100dvh] overflow-auto overscroll-contain p-2"
					onfocusin={(e) =>
						(e.target as HTMLElement)?.scrollIntoView({
							behavior: 'smooth',
							block: 'center',
							inline: 'nearest'
						})}
				>
					<UserProfile />
				</div>
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
