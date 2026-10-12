<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	const { authClient } = getAuthContext();

	interface EmailOtpFlowProps {
		email: string;
		emailExists: boolean;
		onSuccess: () => void;
		onBack: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
	}

	let { email, emailExists, onSuccess, onBack, submitting, onSubmittingChange }: EmailOtpFlowProps =
		$props();

	let otp = $state('');
	let name = $state('');
	const mode: 'login' | 'register' = $derived(emailExists ? 'login' : 'register');

	/**
	 * Handles OTP verification
	 */
	async function handleVerifyOtp(): Promise<void> {
		onSubmittingChange(true);

		try {
			if (mode === 'login') {
				await authClient.signIn.emailOtp(
					{ email, otp },
					{
						onSuccess,
						onError: (ctx) => {
							console.error('OTP verification error:', ctx.error);
							toast.error(ctx.error.message || 'Invalid verification code. Please try again.');
							onSubmittingChange(false);
						}
					}
				);
				return;
			}

			await authClient.signIn.emailOtp(
				{ email, otp },
				{
					onError: (ctx) => {
						console.error('OTP verification error:', ctx.error);
						toast.error(ctx.error.message || 'Invalid verification code. Please try again.');
						onSubmittingChange(false);
					}
				}
			);

			await authClient.updateUser(
				{ name },
				{
					onSuccess,
					onError: (ctx) => {
						console.error('Profile update error:', ctx.error);
						toast.error(ctx.error.message || 'Signed in, but failed to save your name.');
						onSubmittingChange(false);
					}
				}
			);
		} catch (error) {
			console.error('OTP sign in error:', error);
			let errorMessage = 'Invalid verification code. Please try again.';

			if (error instanceof Error) {
				if (error.message.includes('Invalid OTP')) {
					errorMessage = 'Invalid verification code. Please try again.';
				} else if (error.message.includes('expired')) {
					errorMessage = 'Verification code has expired. Please request a new one.';
				} else {
					errorMessage = error.message;
				}
			}

			toast.error(errorMessage);
			onSubmittingChange(false);
		}
	}

	/**
	 * Handles form submission
	 */
	function handleSubmit(event: Event): void {
		event.preventDefault();
		handleVerifyOtp();
	}
</script>

<form onsubmit={handleSubmit} autocomplete="off" class="flex flex-col gap-8">
	<!-- Inputs -->
	<div class="flex flex-col gap-5">
		<div class="flex flex-col">
			<label class="label" for="email">Email</label>
			<input
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
					type="text"
					bind:value={name}
					class="input preset-filled-surface-200"
					placeholder="Enter your full name"
					autocomplete="name"
					required
					disabled={submitting}
				/>
			</div>
		{/if}

		<div class="flex flex-col">
			<label class="label" for="otp">Verification Code</label>
			<input
				type="text"
				bind:value={otp}
				class="input preset-filled-surface-200"
				placeholder="Enter verification code"
				pattern="[0-9]*"
				inputmode="numeric"
				maxlength="6"
				autocomplete="one-time-code"
				required
				disabled={submitting}
			/>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex flex-col gap-2">
		<button
			type="submit"
			class="btn preset-filled w-full"
			disabled={submitting || !otp.trim() || (mode === 'register' && !name.trim())}
		>
			{#if submitting}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					{mode === 'register' ? 'Creating account...' : 'Verifying...'}
				</div>
			{:else}
				{mode === 'register' ? 'Create Account' : 'Verify Code'}
			{/if}
		</button>

		<button type="button" class="btn" onclick={onBack} disabled={submitting}>
			Use a different email
		</button>
	</div>
</form>
