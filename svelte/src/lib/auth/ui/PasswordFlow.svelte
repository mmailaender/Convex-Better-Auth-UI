<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// Primitives
	import * as Password from '#lib/primitives/ui/password/index.js';

	// API
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	const { authClient, authConstants } = getAuthContext();

	interface PasswordFlowProps {
		email: string;
		emailExists: boolean;
		onSuccess: () => void;
		onBack: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onModeChange?: (mode: 'login' | 'register') => void;
		onVerifyEmail?: () => void;
		callbackURL?: string;
	}

	let {
		email,
		emailExists,
		onSuccess,
		onBack,
		submitting,
		onSubmittingChange,
		onVerifyEmail,
		callbackURL = '/'
	}: PasswordFlowProps = $props();

	const mode: 'login' | 'register' = $derived(emailExists ? 'login' : 'register');
	let isRequestingReset = $state(false);
	let fullName = $state('');
	let nameInputRef = $state<HTMLInputElement | null>(null);
	let didAttemptSubmit = $state(false);

	const nameErrorMessage = $derived.by(() => {
		const hasNameValue = fullName.trim().length > 0;
		const input = nameInputRef;
		if (!input || !didAttemptSubmit || input.validity.valid) return null;

		if (input.validity.valueMissing && !hasNameValue) {
			return 'Enter your full name.';
		}

		return input.validationMessage || 'Enter your full name.';
	});

	/**
	 * Handles form submission for login or register
	 */
	async function handleSubmit(event: Event): Promise<void> {
		event.preventDefault();
		didAttemptSubmit = true;

		const form = event.currentTarget as HTMLFormElement;
		if (!form.checkValidity()) {
			form.querySelector<HTMLElement>(':invalid')?.focus();
			return;
		}

		onSubmittingChange(true);

		const formData = new FormData(form);
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
							} else if (
								ctx.error.message.includes('Invalid password') ||
								ctx.error.message.includes('not found')
							) {
								errorMessage =
									'Could not sign in. Please check your credentials or create an account.';
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
			await authClient.signUp.email(
				{ email, password, name: fullName, callbackURL },
				{
					onSuccess: () => {
						if (authConstants.sendEmails) {
							onVerifyEmail?.();
							toast.success('Verification email sent!');
						}
						onSubmittingChange(false);
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

<form onsubmit={handleSubmit} novalidate autocomplete="off" class="flex flex-col gap-8">
	<!-- Inputs -->
	<div class="flex flex-col gap-5">
		<div class="flex flex-col">
			<label class="label" for="email">Email</label>
			<input
				id="email"
				type="email"
				value={email}
				disabled
				class="input preset-filled-surface-200 cursor-not-allowed opacity-60"
			/>
		</div>

		{#if mode === 'register'}
			<div class="flex flex-col">
				<label class="label" for="name">Full Name</label>
				<input
					id="name"
					bind:this={nameInputRef}
					bind:value={fullName}
					name="name"
					type="text"
					class="input preset-filled-surface-200"
					placeholder="Enter your full name"
					autocomplete="name"
					required
					disabled={submitting}
					aria-invalid={nameErrorMessage ? true : undefined}
					aria-describedby={nameErrorMessage ? 'name-error' : undefined}
				/>
				{#if nameErrorMessage}
					<span
						id="name-error"
						class="text-error-600-400 pt-1 pb-1 text-xs"
						aria-live="polite"
						role="status"
					>
						{nameErrorMessage}
					</span>
				{/if}
			</div>
		{/if}

		<div class="flex flex-col">
			<label class="label" for="password">Password</label>
			<Password.Root minScore={mode === 'register' ? 3 : 0}>
				<Password.Input
					id="password"
					name="password"
					placeholder={mode === 'register' ? 'Create a password' : 'Enter your password'}
					autocomplete={mode === 'register' ? 'new-password' : 'current-password'}
					required
					disabled={submitting}
				>
					<Password.ToggleVisibility />
				</Password.Input>
				{#if mode === 'register'}
					<Password.Strength />
				{/if}
				<Password.Error />
			</Password.Root>
			{#if mode === 'login' && authConstants.sendEmails}
				<div class="flex flex-row items-center justify-end pt-1">
					<button
						type="button"
						class="anchor mb-1 shrink-0 text-xs"
						onclick={handleForgotPassword}
						disabled={submitting || isRequestingReset}
					>
						{isRequestingReset ? 'Sending...' : 'Forgot password?'}
					</button>
				</div>
			{/if}
		</div>
	</div>

	<!-- Actions -->
	<div class="flex flex-col gap-2">
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

		<button type="button" class="btn" onclick={onBack} disabled={submitting}>
			Use a different email
		</button>
	</div>
</form>
