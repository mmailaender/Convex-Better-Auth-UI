<script lang="ts">
	// Svelte
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	// Components
	import OrganizationProfile from '$lib/organizations/ui/OrganizationProfile.svelte';

	// Constants
	import { DIALOG_KEY } from '$lib/organizations/utils/organization.constants';

	// API
	import { api } from '$convex/_generated/api';

	// API Types
	import type { authClient } from '$lib/auth/api/auth-client';
	import type { FunctionReturnType } from 'convex/server';
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type ListInvitationType = FunctionReturnType<
		typeof api.organizations.invitations.queries.listInvitations
	>;
	type Role = typeof authClient.$Infer.Member.role;

	type OrganizationProfileHostProps = {
		open?: boolean;
		onSuccessfulDelete?: (() => void) | undefined;
		initialData?: {
			activeUser?: GetActiveUserType;
			activeOrganization?: GetActiveOrganizationType;
			invitationList?: ListInvitationType;
			role?: Role;
		};
	};

	let { open = false, onSuccessfulDelete, initialData }: OrganizationProfileHostProps = $props();

	// Local dialog state (formerly from singleton)
	let orgProfile = $state({
		open: false,
		suppressTransition: false
	});

	// iOS / gesture guards
	let isIOS = $state(false);
	let backSwipeGuard = $state(false);
	let guardTimer: ReturnType<typeof setTimeout> | null = null;
	let prevShouldBeOpen = false;
	let suppressDialogRender = $state(false);

	function closeOrganizationProfile(): void {
		orgProfile.open = false;
	}

	onMount(() => {
		// Detect iOS/iPadOS (including iPadOS 13+ which reports as Macintosh)
		const ua = navigator.userAgent;
		isIOS =
			/iPhone|iPad|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);

		// Hydrate once from the URL so deep-links open at load
		const shouldBeOpen = page.url.searchParams.get('dialog') === DIALOG_KEY;
		orgProfile.open = shouldBeOpen;
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

	// URL → state sync
	$effect(() => {
		const shouldBeOpen = page.url.searchParams.get('dialog') === DIALOG_KEY;
		const closingCandidate = prevShouldBeOpen && !shouldBeOpen;

		if (isIOS && closingCandidate && !backSwipeGuard) {
			backSwipeGuard = true;
			if (guardTimer) clearTimeout(guardTimer);
			guardTimer = setTimeout(() => {
				backSwipeGuard = false;
				guardTimer = null;
			}, 650);
		}

		const closingFromUrl = closingCandidate && backSwipeGuard;

		suppressDialogRender = !!closingFromUrl;
		orgProfile.open = closingFromUrl ? false : shouldBeOpen;
		prevShouldBeOpen = shouldBeOpen;
	});

	// Transition guard
	$effect(() => {
		if (backSwipeGuard) {
			orgProfile.suppressTransition = true;
		} else if (orgProfile.suppressTransition) {
			setTimeout(() => (orgProfile.suppressTransition = false), 100);
		}
	});

	function closeProfileModal() {
		const hasDialog = page.url.searchParams.get('dialog') === DIALOG_KEY;
		if (hasDialog) {
			const url = new URL(page.url);
			url.searchParams.delete('dialog');
			url.searchParams.delete('tab');
			goto(`${url.pathname}${url.search}${url.hash}`, {
				replaceState: true,
				noScroll: true,
				keepFocus: true
			});
		}
		orgProfile.open = false;
	}
</script>

{#if !suppressDialogRender}
	<Dialog.Root
		bind:open={orgProfile.open}
		onOpenChange={(status) => {
			if (!status.open) closeProfileModal();
		}}
	>
		<Dialog.Content
			class={`md:rounded-container top-0 left-0 h-full max-h-[100dvh] w-full max-w-full translate-x-0 translate-y-0 rounded-none p-0 md:top-1/2 md:left-1/2 md:h-[70vh] md:w-2xl md:-translate-x-1/2 md:-translate-y-1/2 lg:w-4xl ${orgProfile.suppressTransition ? 'animate-none transition-none duration-0 data-[state=closed]:duration-0 data-[state=open]:duration-0' : ''}`}
		>
			<div
				class="h-full w-full overflow-auto overscroll-contain"
				onfocusin={(e) => {
					const el = e.target as HTMLElement | null;
					if (!el) return;
					if (isIOS) return;

					const tag = el.tagName.toLowerCase();
					const isEditableTag = tag === 'input' || tag === 'textarea' || tag === 'select';
					const isContentEditable =
						el.isContentEditable || el.getAttribute('contenteditable') === 'true';
					const role = el.getAttribute('role');
					const isTextboxLike = role === 'textbox' || role === 'combobox' || role === 'searchbox';
					const isButtonLike =
						tag === 'button' || tag === 'a' || el.closest('[data-part="trigger"]');

					if ((isEditableTag || isContentEditable || isTextboxLike) && !isButtonLike) {
						el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
					}
				}}
			>
				<OrganizationProfile
					open={orgProfile.open}
					onSuccessfulDelete={closeOrganizationProfile}
					{initialData}
				/>
			</div>
			<Dialog.CloseX />
		</Dialog.Content>
	</Dialog.Root>
{/if}
