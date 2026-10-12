<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	const { authClient } = getAuthContext();

	interface MagicLinkFlowProps {
		email: string;
		onBack: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		callbackURL?: string;
		onLinkSent?: () => void;
	}

	let {
		email,
		onBack,
		submitting,
		onSubmittingChange,
		callbackURL = '/',
		onLinkSent
	}: MagicLinkFlowProps = $props();

	let name = $state('');
	let linkSent = $state(false);

	async function handleSendMagicLink(): Promise<void> {
		onSubmittingChange(true);

		try {
			await authClient.signIn.magicLink(
				{
					email,
					name,
					callbackURL,
					newUserCallbackURL: callbackURL,
					errorCallbackURL: '/signin?error=magic-link-failed'
				},
				{
					onSuccess: () => {
						linkSent = true;
						onSubmittingChange(false);
						toast.success('Magic link sent to your email!');
						onLinkSent?.();
					},
					onError: (ctx) => {
						console.error('Magic link send error:', ctx.error);
						toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
						onSubmittingChange(false);
					}
				}
			);
		} catch (error) {
			console.error('Magic link error:', error);
			toast.error('Failed to send magic link. Please try again.');
			onSubmittingChange(false);
		}
	}

	/**
	 * Handles form submission
	 */
	function handleSubmit(event: Event): void {
		event.preventDefault();
		if (!linkSent) {
			handleSendMagicLink();
		}
	}
</script>

<form onsubmit={handleSubmit} autocomplete="off" class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<label class="label" for="email">Email</label>
		<input
			type="email"
			value={email}
			disabled
			class="input preset-filled-surface-200 cursor-not-allowed opacity-60"
		/>
	</div>

	<div class="flex flex-col">
		<label class="label" for="name">Full Name</label>
		<input
			type="text"
			bind:value={name}
			class="input preset-filled-surface-200"
			placeholder="Enter your full name"
			autocomplete="name"
			required
			disabled={submitting || linkSent}
		/>
	</div>

	<button type="submit" class="btn preset-filled w-full" disabled={submitting || !name.trim()}>
		{#if submitting}
			<div class="flex items-center gap-2">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></div>
				Sending...
			</div>
		{:else}
			Send Magic Link
		{/if}
	</button>

	<button type="button" class="btn" onclick={onBack} disabled={submitting}>
		Use a different email
	</button>
</form>
