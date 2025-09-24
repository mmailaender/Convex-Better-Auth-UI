<script lang="ts">
	// Primitives
	import * as Popover from '$lib/primitives/ui/popover';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	// Icons
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
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
	import { isEditableElement, scheduleScrollIntoView } from '$lib/primitives/utils/focusScroll';

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

	// Ensure SignIn form resets every time the dialog opens
	let signInKey = $state(0);
	let prevSignInDialogOpen = false;

	// iOS back-swipe handling (mirrors OrganizationSwitcher)
	let isIOS: boolean = $state(false);
	let suppressDialogTransition: boolean = $state(false);

	// Back-swipe guard
	let backSwipeGuard: boolean = $state(false);
	let guardTimer: ReturnType<typeof setTimeout> | null = null;
	let prevShouldBeOpen = false;
	let suppressDialogRender: boolean = $state(false);
	let internalCloseGuard: boolean = $state(false);
	let internalCloseTimer: ReturnType<typeof setTimeout> | null = null;

	const DIALOG_KEY = 'user-profile';

	// Opening is driven explicitly via openProfileModal() pushing the URL param.

	// 1 + 2: Keep dialog state in sync with the URL only.
	// During iOS interactive back, block a brief re-open only when closing-from-URL.
	// If popstate doesn't fire on iOS Chrome, arm the guard when we detect URL-driven close.
	$effect(() => {
		const shouldBeOpen = page.url.searchParams.get('dialog') === DIALOG_KEY;
		const closingCandidate = prevShouldBeOpen && !shouldBeOpen;

		if (isIOS && closingCandidate && !backSwipeGuard && !internalCloseGuard) {
			backSwipeGuard = true;
			if (guardTimer) clearTimeout(guardTimer);
			guardTimer = setTimeout(() => {
				backSwipeGuard = false;
				guardTimer = null;
			}, 650);
		}

		const closingFromUrl = closingCandidate && backSwipeGuard;
		suppressDialogRender = !!closingFromUrl;
		profileDialogOpen = closingFromUrl ? false : shouldBeOpen;
		prevShouldBeOpen = shouldBeOpen;
	});

	// URL is the single source of truth; no state->URL/URL->state effects are needed.

	/**
	 * Open profile modal and close popover (via shallow routing)
	 */
	function openProfileModal(): void {
		userPopoverOpen = false;
		const has = page.url.searchParams.get('dialog') === DIALOG_KEY;
		if (!has) {
			const url = new URL(page.url);
			url.searchParams.set('dialog', DIALOG_KEY);
			const path = `${url.pathname}${url.search}${url.hash}`;
			void goto(path, {
				replaceState: false,
				noScroll: true,
				keepFocus: true,
				invalidateAll: false
			});
		}
	}

	// 4: If user closes via backdrop / X, remove the param with replaceState
	function closeProfileModal() {
		// Mark programmatic close so we don't arm back-swipe guard from URL-driven close
		internalCloseGuard = true;
		if (internalCloseTimer) clearTimeout(internalCloseTimer);
		internalCloseTimer = setTimeout(() => {
			internalCloseGuard = false;
			internalCloseTimer = null;
		}, 500);
		const hasDialog = page.url.searchParams.get('dialog') === DIALOG_KEY;
		if (hasDialog) {
			const url = new URL(page.url);
			url.searchParams.delete('dialog');
			const path = `${url.pathname}${url.search}${url.hash}`;
			void goto(path, {
				replaceState: true, // no extra history entry
				noScroll: true,
				keepFocus: true,
				invalidateAll: false
			});
		}
	}

	// iOS Safari back-swipe guard only: do not mutate state here, only arm guard
	onMount(() => {
		// Detect iOS/iPadOS (including iPadOS 13+ which reports as Macintosh)
		const ua = navigator.userAgent;
		isIOS =
			/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);

		const onPopState = () => {
			if (!isIOS) return;
			// Only arm guard when the dialog is actually closing via history
			const url = new URL(window.location.href);
			const shouldBeOpen = url.searchParams.get('dialog') === DIALOG_KEY;
			const closingCandidate = prevShouldBeOpen && !shouldBeOpen;
			if (closingCandidate) {
				backSwipeGuard = true;
				if (guardTimer) clearTimeout(guardTimer);
				guardTimer = setTimeout(() => {
					backSwipeGuard = false;
					guardTimer = null;
				}, 650);
			}
		};
		window.addEventListener('popstate', onPopState);
		return () => window.removeEventListener('popstate', onPopState);
	});

	// While guard is active, suppress transitions; release slightly after.
	$effect(() => {
		if (backSwipeGuard) {
			suppressDialogTransition = true;
		} else if (suppressDialogTransition) {
			setTimeout(() => (suppressDialogTransition = false), 100);
		}
	});

	// Bump key when dialog transitions from closed -> open to remount SignIn
	$effect(() => {
		if (signInDialogOpen && !prevSignInDialogOpen) {
			signInKey += 1;
		}
		prevSignInDialogOpen = signInDialogOpen;
	});
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
					class="ring-surface-100-900 size-9 ring-0 duration-200 ease-out hover:ring-4"
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
						class="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex flex-row items-center gap-4 p-3 pr-6 duration-200 ease-in-out"
						onclick={openProfileModal}
					>
						<Avatar.Root class="size-12">
							<Avatar.Image src={user.image} alt={user.name} />
							<Avatar.Fallback>
								<Avatar.Marble name={user.name} />
							</Avatar.Fallback>
						</Avatar.Root>
						<div class="flex flex-1 flex-col gap-0 overflow-hidden">
							<p class="truncate text-left text-sm font-medium">{user.name}</p>
							<p class="truncate text-left text-xs opacity-75">
								{user.email}
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

		<!-- Profile Dialog -->
		{#if !suppressDialogRender}
			<Dialog.Root
				bind:open={profileDialogOpen}
				onOpenChange={(status) => {
					if (!status.open) {
						closeProfileModal();
					}
				}}
			>
				<Dialog.Content
					class={`md:rounded-container top-0 left-0 flex h-full max-h-[100dvh] w-full max-w-full
		       translate-x-0 translate-y-0 flex-col items-start rounded-none md:top-[50%]
		       md:left-[50%] md:h-auto md:max-h-[90vh] md:w-auto
		        md:translate-x-[-50%] md:translate-y-[-50%] ${suppressDialogTransition ? 'animate-none transition-none duration-0 data-[state=closed]:duration-0 data-[state=open]:duration-0' : ''}`}
				>
					<Dialog.Header>
						<Dialog.Title>Profile</Dialog.Title>
					</Dialog.Header>
					<div
						class=" max-h-[100dvh] w-full overflow-auto overscroll-contain p-6 md:w-[560px]"
						onfocusin={(e) => {
							const el = e.target as HTMLElement | null;
							if (!el) return;
							if (!isEditableElement(el)) return;
							scheduleScrollIntoView(el);
						}}
					>
						<UserProfile />
					</div>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		{/if}
	{:else}
		<div class="placeholder-circle size-10 animate-pulse"></div>
	{/if}
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
		class="sm:rounded-container h-full w-full rounded-none sm:h-auto sm:w-4xl sm:max-w-md max-h-[100dvh] sm:max-h-[90vh]"
	>
		{#key signInKey}
			<SignIn onSignIn={() => (signInDialogOpen = false)} class="p-2 sm:p-8" />
		{/key}
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>
