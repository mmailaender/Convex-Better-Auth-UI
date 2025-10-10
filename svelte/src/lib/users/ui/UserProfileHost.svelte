<script lang="ts">
	// Svelte
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	// Components
	import UserProfile from '$lib/users/ui/UserProfile.svelte';
	// Utils
	import { isEditableElement, scheduleScrollIntoView } from '$lib/primitives/utils/focusScroll';

	// Constants
	import { DIALOG_KEY } from '$lib/users/utils/user.constants';

	// API
	import { api } from '$convex/_generated/api';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// API Types
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListAccountsType = FunctionReturnType<typeof api.users.queries.listAccounts>;

	type UserProfileHostProps = {
		initialData?: {
			activeUser?: GetActiveUserType;
			accountList?: ListAccountsType;
		};
	};

	let { initialData }: UserProfileHostProps = $props();

	// Auth
	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Local dialog state (formerly from singleton)
	let userProfile = $state({
		open: false,
		suppressTransition: false
	});

	// iOS / gesture guards
	let isIOS = $state(false);
	let backSwipeGuard = $state(false);
	let guardTimer: ReturnType<typeof setTimeout> | null = null;
	let prevShouldBeOpen = false;
	let suppressDialogRender = $state(false);
	let internalCloseGuard = $state(false);
	let internalCloseTimer: ReturnType<typeof setTimeout> | null = null;

	onMount(() => {
		// Detect iOS/iPadOS (including iPadOS 13+ which reports as Macintosh)
		const ua = navigator.userAgent;
		isIOS =
			/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);

		// Hydrate once from the URL so deep-links open at load
		const shouldBeOpen = page.url.searchParams.get('dialog') === DIALOG_KEY;
		userProfile.open = shouldBeOpen;
		prevShouldBeOpen = shouldBeOpen;

		const onPopState = () => {
			if (!isIOS) return;
			const url = new URL(window.location.href);
			const shouldBeOpenNow = url.searchParams.get('dialog') === DIALOG_KEY;
			const closingCandidate = prevShouldBeOpen && !shouldBeOpenNow;
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

	onMount(() => {
		const handleClose = () => closeProfileModal();
		window.addEventListener('user-profile:close', handleClose);
		return () => window.removeEventListener('user-profile:close', handleClose);
	});

	// URL → state sync
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
		userProfile.open = closingFromUrl ? false : shouldBeOpen;
		prevShouldBeOpen = shouldBeOpen;
	});

	// Transition guard
	$effect(() => {
		if (backSwipeGuard) {
			userProfile.suppressTransition = true;
		} else if (userProfile.suppressTransition) {
			setTimeout(() => (userProfile.suppressTransition = false), 100);
		}
	});

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
			goto(`${url.pathname}${url.search}${url.hash}`, {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			});
		}
		userProfile.open = false;
	}
</script>

{#if isAuthenticated && !suppressDialogRender}
	<Dialog.Root
		bind:open={userProfile.open}
		onOpenChange={(status) => {
			if (!status.open) closeProfileModal();
		}}
	>
		<Dialog.Content
			class={`md:rounded-container top-0 left-0 flex h-full max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 flex-col items-start rounded-none md:top-[50%] md:left-[50%] md:h-auto md:max-h-[90vh] md:w-auto md:translate-x-[-50%] md:translate-y-[-50%] ${userProfile.suppressTransition ? 'animate-none transition-none duration-0 data-[state=closed]:duration-0 data-[state=open]:duration-0' : ''}`}
		>
			<Dialog.Header>
				<Dialog.Title>Profile</Dialog.Title>
			</Dialog.Header>
			<div
				class="max-h-[100dvh] w-full overflow-auto overscroll-contain p-6 md:w-[560px]"
				onfocusin={(e) => {
					const el = e.target as HTMLElement | null;
					if (!el) return;
					if (!isEditableElement(el)) return;
					scheduleScrollIntoView(el);
				}}
			>
				<UserProfile {initialData} />
			</div>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{/if}
