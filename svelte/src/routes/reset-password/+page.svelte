<script lang="ts">
	// SvelteKit
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// Primitives
	import { toast } from 'svelte-sonner';

	// Icons
	import { AlertTriangle } from '@lucide/svelte';

	// API
	import { authClient } from '$lib/auth/api/auth-client';
	import { onMount } from 'svelte';

	type ResetState = 'loading' | 'valid-token' | 'invalid-token' | 'error';

	// State
	let resetState: ResetState = $state('loading');
	let password: string = $state('');
	let confirmPassword: string = $state('');
	let isSubmitting: boolean = $state(false);
	let token: string | null = $state(null);

	// Extract token from URL parameters and validate
	onMount(() => {
		const tokenParam = page.url.searchParams.get('token');
		const errorParam = page.url.searchParams.get('error');

		if (errorParam === 'INVALID_TOKEN') {
			resetState = 'invalid-token';
		} else if (tokenParam) {
			token = tokenParam;
			resetState = 'valid-token';
		} else {
			resetState = 'invalid-token';
		}
	});

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();

		if (password !== confirmPassword) {
			toast.error('Passwords do not match');
			return;
		}

		if (password.length < 8) {
			toast.error('Password must be at least 8 characters long');
			return;
		}

		if (!token) {
			toast.error('Invalid reset token');
			return;
		}

		isSubmitting = true;

		try {
			const { error } = await authClient.resetPassword({
				newPassword: password,
				token
			});

			if (error) {
				throw new Error(error.message || 'Failed to reset password');
			}
			toast.success('Password reset successfully!');

			// Redirect immediately to sign in
			goto('/signin');
		} catch (error) {
			console.error('Reset password error:', error);
			const errorMessage =
				error instanceof Error ? error.message : 'Failed to reset password. Please try again.';

			if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
				resetState = 'invalid-token';
				toast.error('Reset link has expired or is invalid. Please request a new one.');
			} else {
				resetState = 'error';
				toast.error(errorMessage);
			}
		} finally {
			isSubmitting = false;
		}
	}

	function handleTryAgain() {
		resetState = 'valid-token';
		password = '';
		confirmPassword = '';
	}
</script>

<div class="flex h-screen w-full flex-col items-center justify-center">
	<div class="flex h-full w-full max-w-md flex-col p-8">
		<div class="mb-10">
			<h1 class="h4 text-left leading-9 tracking-tighter">
				{resetState === 'valid-token' ? 'Reset your password' : 'Password Reset'}
			</h1>
			{#if resetState === 'valid-token'}
				<p class="text-surface-600-400 mt-3 text-left text-sm">Enter your new password below.</p>
			{/if}
		</div>

		<div class="flex flex-col justify-center">
			{#if resetState === 'loading'}
				<div class="flex flex-col items-center gap-4">
					<div
						class="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					<p class="text-surface-600-400 text-sm">Verifying reset link...</p>
				</div>
			{:else if resetState === 'invalid-token'}
				<div class="flex flex-col items-center gap-6">
					<div class="bg-error-500/10 text-error-500 rounded-full p-3">
						<AlertTriangle class="size-6" />
					</div>
					<div class="text-center">
						<h2 class="text-surface-950-50 text-xl font-semibold">Invalid or Expired Link</h2>
						<p class="text-surface-600-400 mt-2 text-sm">
							This password reset link is invalid or has expired.
							<br />
							Please request a new password reset link.
						</p>
					</div>
					<a href="/signin" class="btn preset-filled">Back to Sign In</a>
				</div>
			{:else if resetState === 'valid-token'}
				<form onsubmit={handleSubmit} class="flex w-full flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="new-password" class="text-surface-950-50 text-sm font-medium"
							>New Password</label
						>
						<input
							id="new-password"
							type="password"
							bind:value={password}
							class="input preset-filled-surface-200"
							placeholder="Enter your new password"
							required
							minlength="8"
							disabled={isSubmitting}
						/>
					</div>

					<div class="flex flex-col gap-2">
						<label for="confirm-password" class="text-surface-950-50 text-sm font-medium">
							Confirm New Password
						</label>
						<input
							id="confirm-password"
							type="password"
							bind:value={confirmPassword}
							class="input preset-filled-surface-200"
							placeholder="Confirm your new password"
							required
							minlength="8"
							disabled={isSubmitting}
						/>
					</div>

					<button type="submit" class="btn preset-filled w-full" disabled={isSubmitting}>
						{#if isSubmitting}
							<div class="flex items-center gap-2">
								<div
									class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
								></div>
								Resetting password...
							</div>
						{:else}
							Reset Password
						{/if}
					</button>

					<a href="/signin" class="anchor text-center text-sm">Back to Sign In</a>
				</form>
			{:else}
				<!-- error state -->
				<div class="flex flex-col items-center gap-6">
					<div class="bg-error-500/10 text-error-500 rounded-full p-3">
						<AlertTriangle class="size-6" />
					</div>
					<div class="text-center">
						<h2 class="text-surface-950-50 text-xl font-semibold">Something went wrong</h2>
						<p class="text-surface-600-400 mt-2 text-sm">
							There was an error resetting your password.
							<br />
							Please try again or request a new reset link.
						</p>
					</div>
					<div class="flex gap-2">
						<a href="/signin" class="btn preset-tonal">Back to Sign In</a>
						<button type="button" class="btn preset-filled" onclick={handleTryAgain}>
							Try Again
						</button>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
