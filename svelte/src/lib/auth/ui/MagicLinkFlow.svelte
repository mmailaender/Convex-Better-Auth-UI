<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { authClient } from '$lib/auth/api/auth-client';

	interface MagicLinkFlowProps {
		email: string;
		onBack: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		callbackURL?: string;
		onLinkSent?: () => void;
		onAutoSendChange?: (pending: boolean) => void;
	}

	let {
		email,
		onBack,
		submitting,
		onSubmittingChange,
		callbackURL = '/',
		onLinkSent,
		onAutoSendChange
	}: MagicLinkFlowProps = $props();

	const client = useConvexClient();
	let name = $state('');
	let linkSent = $state(false);
	let mode = $state<'login' | 'register'>('login');
	let emailChecked = $state(false);
	let linkSentRef = { current: false };

	// Check email availability and send magic link when component mounts
	$effect(() => {
		// Prevent multiple checks and magic link sends
		if (linkSentRef.current || emailChecked) return;
		linkSentRef.current = true;

		const checkEmailAndSendMagicLink = async () => {
			onSubmittingChange(true);
			onAutoSendChange?.(true);

			try {
				// First, check if email exists
				const emailData = await client.action(api.users.actions.checkEmailAvailabilityAndValidity, {
					email
				});
				mode = emailData.exists ? 'login' : 'register';
				emailChecked = true;

				// If user exists, send magic link immediately
				if (emailData.exists) {
					await authClient.signIn.magicLink(
						{
							email,
							callbackURL,
							errorCallbackURL: '/signin?error=magic-link-failed'
						},
						{
							onSuccess: () => {
								linkSent = true;
								onSubmittingChange(false);
								toast.success('Magic link sent to your email!');
								onAutoSendChange?.(false);
								onLinkSent?.();
							},
							onError: (ctx) => {
								console.error('Magic link send error:', ctx.error);
								toast.error(ctx.error.message || 'Failed to send magic link. Please try again.');
								onSubmittingChange(false);
								// Reset the refs on error so user can retry
								linkSentRef.current = false;
								emailChecked = false;
								onAutoSendChange?.(false);
							}
						}
					);
				} else {
					// New user - just stop loading, we'll ask for name first
					onSubmittingChange(false);
					onAutoSendChange?.(false);
				}
			} catch (error) {
				console.error('Email validation error:', error);
				toast.error('Failed to validate email. Please try again.');
				onSubmittingChange(false);
				// Reset the refs on error so user can retry
				linkSentRef.current = false;
				emailChecked = false;
				onAutoSendChange?.(false);
			}
		};

		checkEmailAndSendMagicLink();
	});

	/**
	 * Handles sending magic link for new users
	 */
	async function handleSendMagicLink(): Promise<void> {
		onSubmittingChange(true);

		try {
			await authClient.signIn.magicLink(
				{
					email,
					name: mode === 'register' ? name : undefined,
					callbackURL,
					newUserCallbackURL: callbackURL,
					errorCallbackURL: '/signin?error=magic-link-failed'
				},
				{
					onSuccess: () => {
						linkSent = true;
						onSubmittingChange(false);
						toast.success('Magic link sent to your email!');
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
		if (!linkSent && mode === 'register' && emailChecked) {
			handleSendMagicLink();
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<label class="label" for="email">Email</label>
		<input
			type="email"
			value={email}
			disabled
			class="input preset-filled-surface-200 cursor-not-allowed opacity-60"
		/>
	</div>

	{#if mode === 'register' && emailChecked}
		<div class="flex flex-col">
			<label class="label" for="name">Full Name</label>
			<input
				type="text"
				bind:value={name}
				class="input preset-filled-surface-200"
				placeholder="Enter your full name"
				required
				disabled={submitting || linkSent}
			/>
		</div>
	{/if}

	{#if mode === 'register' && emailChecked}
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
	{/if}

	{#if !emailChecked}
		<div class="flex items-center justify-center py-4">
			<div class="flex items-center gap-2">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></div>
				<span class="text-surface-600-400 text-sm">Checking email...</span>
			</div>
		</div>
	{/if}

	<button type="button" class="btn" onclick={onBack} disabled={submitting}>
		Use a different email
	</button>
</form>
