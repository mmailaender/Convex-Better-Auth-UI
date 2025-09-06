<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { authClient } from '$lib/auth/api/auth-client';

	interface EmailOtpFlowProps {
		email: string;
		onSuccess: () => void;
		onBack: () => void;
		submitting: boolean;
		onSubmittingChange: (submitting: boolean) => void;
		onModeChange?: (mode: 'login' | 'register') => void;
		onOtpSent?: () => void;
	}

	let {
		email,
		onSuccess,
		onBack,
		submitting,
		onSubmittingChange,
		onModeChange,
		onOtpSent
	}: EmailOtpFlowProps = $props();

	const client = useConvexClient();
	let otp = $state('');
	let name = $state('');
	let otpSent = $state(false);
	let mode = $state<'login' | 'register'>('login');
	let emailChecked = $state(false);
	let otpSentRef = { current: false };

	// Check email availability and send OTP when component mounts
	$effect(() => {
		// Prevent multiple checks and OTP sends
		if (otpSentRef.current || emailChecked) return;
		otpSentRef.current = true;

		const checkEmailAndSendOtp = async () => {
			onSubmittingChange(true);

			try {
				// First, check if email exists
				const emailData = await client.action(api.users.actions.checkEmailAvailabilityAndValidity, {
					email
				});
				if (!emailData.valid) {
					toast.error(emailData.reason || 'Please enter a valid email address.');
					onSubmittingChange(false);
					// Reset the refs so user can go back and correct the email
					otpSentRef.current = false;
					emailChecked = false;
					return;
				}
				mode = emailData.exists ? 'login' : 'register';
				onModeChange?.(mode);
				emailChecked = true;

				// Then send OTP
				await authClient.emailOtp.sendVerificationOtp(
					{ email, type: 'sign-in' },
					{
						onSuccess: () => {
							otpSent = true;
							onSubmittingChange(false);
							toast.success('Verification code sent to your email!');
							onOtpSent?.();
						},
						onError: (ctx) => {
							console.error('OTP send error:', ctx.error);
							toast.error(
								ctx.error.message || 'Failed to send verification code. Please try again.'
							);
							onSubmittingChange(false);
							// Reset the refs on error so user can retry
							otpSentRef.current = false;
							emailChecked = false;
						}
					}
				);
			} catch (error) {
				console.error('Email validation error:', error);
				toast.error('Failed to validate email. Please try again.');
				onSubmittingChange(false);
				// Reset the refs on error so user can retry
				otpSentRef.current = false;
				emailChecked = false;
			}
		};

		checkEmailAndSendOtp();
	});

	/**
	 * Handles OTP verification
	 */
	async function handleVerifyOtp(): Promise<void> {
		onSubmittingChange(true);

		if (mode === 'login') {
			// Existing user - use regular sign in
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
		} else {
			// New user - use sign up with OTP
			try {
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
							console.error('OTP verification error:', ctx.error);
							toast.error(ctx.error.message || 'Invalid verification code. Please try again.');
							onSubmittingChange(false);
						}
					}
				);
			} catch (error) {
				console.error('OTP sign up error:', error);
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

		{#if mode === 'register' && emailChecked}
			<div class="flex flex-col">
				<label class="label" for="name">Full Name</label>
				<input
					type="text"
					bind:value={name}
					class="input preset-filled-surface-200"
					placeholder="Enter your full name"
					autocomplete="name"
					required
					disabled={submitting || !otpSent}
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
				disabled={!otpSent}
			/>
		</div>
	</div>

	<!-- Actions -->
	<div class="flex flex-col gap-2">
		<button
			type="submit"
			class="btn preset-filled w-full"
			disabled={submitting || !otp.trim() || !otpSent || (mode === 'register' && !name.trim())}
		>
			{#if submitting}
				<div class="flex items-center gap-2">
					<div
						class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
					></div>
					{!emailChecked
						? 'Checking email...'
						: !otpSent
							? 'Sending...'
							: mode === 'register'
								? 'Creating account...'
								: 'Verifying...'}
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
