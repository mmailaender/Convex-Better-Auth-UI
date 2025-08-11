<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { authClient } from '$lib/auth/api/auth-client';

	interface PasswordFlowProps {
		email: string;
		onSuccess: () => void;
		onBack: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onModeChange?: (mode: 'login' | 'register') => void;
		onVerifyEmail?: () => void;
	}

	let {
		email,
		onSuccess,
		onBack,
		submitting,
		onSubmittingChange,
		onModeChange,
		onVerifyEmail
	}: PasswordFlowProps = $props();

	const client = useConvexClient();
	let mode = $state<'login' | 'register'>('login');
	let showForgotPasswordDialog = $state(false);
	let isRequestingReset = $state(false);

	// Determine if this is login or register based on email
	$effect(() => {
		const validateEmail = async () => {
			try {
				const data = await client.action(api.users.actions.checkEmailAvailabilityAndValidity, {
					email
				});
				mode = data.exists ? 'login' : 'register';
				onModeChange?.(mode);
			} catch (error) {
				console.error('Email validation error:', error);
			}
		};
		validateEmail();
	});

	/**
	 * Handles form submission for login or register
	 */
	async function handleSubmit(event: Event): Promise<void> {
		event.preventDefault();
		onSubmittingChange(true);

		const formData = new FormData(event.currentTarget as HTMLFormElement);
		const password = formData.get('password') as string;

		if (mode === 'login') {
			await authClient.signIn.email(
				{ email, password },
				{
					onSuccess,
					onError: (ctx) => {
						console.error('Sign in error:', ctx.error);
						let errorMessage = 'Could not sign in. Please check your credentials.';

						if (ctx.error.message) {
							if (ctx.error.status === 403) {
								errorMessage = 'Please verify your email address.';
							} else if (ctx.error.message.includes('Invalid password')) {
								errorMessage = 'Invalid password. Please try again.';
							} else if (ctx.error.message.includes('not found')) {
								errorMessage = 'Account not found. Please check your email or sign up.';
							} else {
								errorMessage = ctx.error.message;
							}
						}

						toast.error(errorMessage);
						onSubmittingChange(false);
					}
				}
			);
		} else {
			const name = formData.get('name') as string;

			await authClient.signUp.email(
				{ email, password, name },
				{
					onSuccess: () => {
						onVerifyEmail?.();
						onSubmittingChange(false);
						toast.success('Verification email sent!');
					},
					onError: (ctx) => {
						console.error('Sign up error:', ctx.error);
						let errorMessage = 'Could not create account. Please try again.';

						if (ctx.error.message) {
							if (ctx.error.message.includes('already exists')) {
								errorMessage = 'An account with this email already exists.';
							} else if (ctx.error.message.includes('password')) {
								errorMessage = 'Password does not meet requirements.';
							} else {
								errorMessage = ctx.error.message;
							}
						}

						toast.error(errorMessage);
						onSubmittingChange(false);
					}
				}
			);
		}
	}

	/**
	 * Handles forgot password functionality
	 */
	async function handleForgotPassword(): Promise<void> {
		isRequestingReset = true;
		try {
			const { error } = await authClient.requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`
			});

			if (error) {
				throw new Error(error.message || 'Failed to send reset email');
			}

			showForgotPasswordDialog = true;
			toast.success('Password reset email sent!');
		} catch (error) {
			console.error('Password reset error:', error);
			toast.error(
				error instanceof Error ? error.message : 'Failed to send reset email. Please try again.'
			);
		} finally {
			isRequestingReset = false;
		}
	}
</script>

<form onsubmit={handleSubmit} class="flex flex-col gap-4">
	<div class="flex flex-col gap-2">
		<label class="text-surface-950-50 text-sm font-medium" for="email">Email</label>
		<input
			type="email"
			value={email}
			disabled
			class="input preset-filled-surface-200 cursor-not-allowed opacity-60"
		/>
	</div>

	{#if mode === 'register'}
		<div class="flex flex-col gap-2">
			<label class="text-surface-950-50 text-sm font-medium" for="name">Full Name</label>
			<input
				name="name"
				type="text"
				class="input preset-filled-surface-200"
				placeholder="Enter your full name"
				required
				disabled={submitting}
			/>
		</div>
	{/if}

	<div class="flex flex-col gap-2">
		<label class="text-surface-950-50 text-sm font-medium" for="password">Password</label>
		<input
			name="password"
			type="password"
			class="input preset-filled-surface-200"
			placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
			required
			disabled={submitting}
		/>
	</div>

	<button type="submit" class="btn preset-filled w-full" disabled={submitting}>
		{#if submitting}
			<div class="flex items-center gap-2">
				<div
					class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
				></div>
				{mode === 'register' ? 'Creating account...' : 'Signing in...'}
			</div>
		{:else}
			{mode === 'register' ? 'Create Account' : 'Sign In'}
		{/if}
	</button>

	{#if mode === 'login'}
		<button
			type="button"
			class="anchor text-center text-sm"
			onclick={handleForgotPassword}
			disabled={submitting || isRequestingReset}
		>
			{isRequestingReset ? 'Sending...' : 'Forgot password?'}
		</button>
	{/if}

	<button type="button" class="anchor text-center text-sm" onclick={onBack} disabled={submitting}>
		Use a different email
	</button>

	<!-- Forgot Password Confirmation Dialog -->
	{#if showForgotPasswordDialog}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
			<div
				class="bg-surface-50-950 border-surface-200-800 mx-4 w-full max-w-md rounded-lg border p-6 shadow-lg"
			>
				<div class="mb-4">
					<h3 class="text-surface-950-50 text-lg font-semibold">Check your email</h3>
					<p class="text-surface-600-400 mt-2 text-sm">
						We've sent a password reset link to <strong>{email}</strong>.
						<br />
						Click the link in the email to reset your password.
					</p>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						class="btn preset-filled flex-1"
						onclick={() => (showForgotPasswordDialog = false)}
					>
						Got it
					</button>
					<button
						type="button"
						class="btn preset-tonal flex-1"
						onclick={handleForgotPassword}
						disabled={isRequestingReset}
					>
						{isRequestingReset ? 'Sending...' : 'Resend email'}
					</button>
				</div>
			</div>
		</div>
	{/if}
</form>
