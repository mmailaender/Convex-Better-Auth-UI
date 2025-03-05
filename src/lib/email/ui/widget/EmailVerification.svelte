<script lang="ts">
	import { callForm } from '$lib/primitives/api/callForm';

	import type { User } from '$lib/db/schema/types/custom';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let otp = $state('');
	let localSuccess = $state('');
	let localError = $state('');

	async function handleResendVerification() {
		try {
			await callForm({
				url: '/user-profile?/resendVerification',
				data: { email: user.emailVerification!, userId: user.id }
			});
			localSuccess = 'Verification code resent.';
		} catch (err) {
			localError = 'Error resending verification code.';
		}
	}

	async function handleCancelVerification() {
		try {
			await callForm({
				url: '/user-profile?/cancelEmailVerification',
				data: { emailVerification: user.emailVerification! }
			});
			localSuccess = `Canceled verification for "${user.emailVerification!}".`;
			user.emailVerification = undefined;
		} catch (error) {
			localError = 'Error canceling verification.';
		}
	}

	async function handleVerifyOtp() {
		try {
			const res = await callForm<User>({
				url: '/user-profile?/addEmail',
				data: {
					email: user.emailVerification!,
					verificationOTP: otp
				}
			});
			user.emails = res.emails;
			console.log('handleVerifyOtp res.emailVerification: ', res.emailVerification);
			user.emailVerification = res.emailVerification;
			localSuccess = 'Email verified successfully!';
		} catch (error) {
			localError = 'Error verifying OTP.';
		}
	}
</script>

{#if user.emailVerification}
	<div class="mb-6">
		<div>
			<span class="text-surface-800-200">{user.emailVerification}</span>
			<span class="badge preset-tonal-surface">Unverified</span>
		</div>
		<div class="border-surface-300-700 mt-2 w-full max-w-sm rounded-lg border p-6 shadow-md">
			<h2 class="text-surface-900-100 text-lg font-semibold">Verify email address</h2>
			<p class="text-surface-600-400 mt-1 text-sm">
				Enter the verification code sent to
				<span class="text-surface-900-100 font-medium">{user.emailVerification}</span>
			</p>
			<div class="mt-4 flex justify-between space-x-1">
				<input type="text" class="input" bind:value={otp} />
			</div>
			<div class="mt-4">
				<button class="anchor text-sm" onclick={handleResendVerification}>
					Didn't receive a code? Resend
				</button>
			</div>
			<div class="mt-6 flex justify-end gap-2 text-sm">
				<button class="btn hover:preset-tonal-surface" onclick={handleCancelVerification}>
					Cancel
				</button>
				<button class="btn preset-filled-primary-500" onclick={handleVerifyOtp}> Verify </button>
			</div>
			{#if localSuccess}
				<p class="text-success-600-400">{localSuccess}</p>
			{/if}
			{#if localError}
				<p class="text-error-600-400">{localError}</p>
			{/if}
		</div>
	</div>
{/if}
