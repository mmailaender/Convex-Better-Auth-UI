<script lang="ts">
	// Svelte
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Auth
	import { authClient } from '$lib/auth/api/auth-client';

	// Icons
	import CheckCircle2Icon from '@lucide/svelte/icons/check-circle-2';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	// Get invitationId from page params
	let invitationId = $derived(page.params.invitationId);

	// Reactive state using runes
	let isLoading = $state(true);
	let accepted = $state(false);
	let error = $state<string | null>(null);

	// Function to accept invitation
	async function acceptInvitation(id: string) {
		try {
			const { data } = await authClient.organization.acceptInvitation({
				invitationId: id
			});
			console.log('data', data);

			const orgId = data?.invitation?.organizationId;
			if (!orgId) {
				throw new Error('Invalid invitation');
			}

			accepted = true;
			goto('/');
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unknown error occurred';
		} finally {
			isLoading = false;
		}
	}

	// Effect to handle invitation acceptance
	onMount(() => {
		if (invitationId) {
			acceptInvitation(invitationId);
		} else {
			isLoading = false;
		}
	});
</script>

<div class="flex min-h-dvh items-center justify-center p-6">
	<div class="card w-full max-w-md p-8 text-center">
		{#if isLoading}
			<div class="flex flex-col items-center gap-4">
				<Loader2Icon class="size-10 animate-spin" />
				<h1 class="text-lg font-semibold">Accepting invitation…</h1>
				<p class="text-sm opacity-60">Please wait a moment.</p>
			</div>
		{:else if accepted}
			<div class="flex flex-col items-center gap-4">
				<CheckCircle2Icon class="size-10" />
				<h1 class="text-lg font-semibold">Invitation accepted</h1>
				<p class="text-sm opacity-60">Redirecting to dashboard…</p>
			</div>
		{:else if error}
			<div class="flex flex-col items-center gap-4">
				<TriangleAlertIcon class="size-10" />
				<h1 class="text-lg font-semibold">Couldn't accept invitation</h1>
				<p class="text-sm opacity-80">{error}</p>
				<a class="btn preset-tonal hover:preset-filled" href="/">Go to Home</a>
			</div>
		{:else if !invitationId}
			<div class="flex flex-col items-center gap-4">
				<TriangleAlertIcon class="size-10" />
				<h1 class="text-lg font-semibold">Invalid invite link</h1>
				<p class="text-sm opacity-60">Please use a valid invite link.</p>
				<a class="btn preset-tonal hover:preset-filled" href="/">Go to Home</a>
			</div>
		{/if}
	</div>
</div>
