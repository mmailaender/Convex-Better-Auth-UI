<script lang="ts">
	// Svelte
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';

	type AuthMethod = 'password' | 'emailOTP' | 'magicLink';

	interface EmailStepProps {
		email: string;
		onEmailChange: (email: string) => void;
		onMethodSelect: (method: AuthMethod) => void;
		submitting: boolean;
		availableMethods: AuthMethod[];
	}

	let { email, onEmailChange, onMethodSelect, submitting, availableMethods }: EmailStepProps =
		$props();

	const client = useConvexClient();
	let validatingEmail = $state(false);

	/**
	 * Gets the button text for single method scenarios
	 */
	function getSingleMethodButtonText(): string {
		if (availableMethods.length === 1) {
			switch (availableMethods[0]) {
				case 'password':
					return 'Continue';
				case 'emailOTP':
					return 'Continue';
				case 'magicLink':
					return 'Continue';
				default:
					return 'Continue';
			}
		}
		return 'Continue with Password';
	}

	/**
	 * Handles method selection and email validation
	 */
	async function handleMethodClick(method: AuthMethod): Promise<void> {
		if (!email) {
			toast.error('Please enter your email address');
			return;
		}

		// If only one method is available, go directly to that flow
		if (availableMethods.length === 1) {
			onMethodSelect(availableMethods[0]);
			return;
		}

		// For password flow, we need to validate email first
		if (method === 'password') {
			validatingEmail = true;
			try {
				await client.action(api.users.actions.checkEmailAvailabilityAndValidity, { email });
				// This would typically determine login vs register, but for simplicity
				// we'll just go to password flow
				onMethodSelect('password');
			} catch (error) {
				toast.error('Failed to validate email. Please try again.');
				console.error('Email validation error:', error);
			} finally {
				validatingEmail = false;
			}
		} else {
			// For other methods, go directly to the flow
			onMethodSelect(method);
		}
	}
</script>

<div class="flex flex-col gap-8">
	<div class="flex flex-col">
		<label class="label" for=" email">Email</label>
		<input
			id="email"
			name="email"
			type="email"
			value={email}
			oninput={(e) => onEmailChange(e.currentTarget.value)}
			class="input preset-filled-surface-200 text-sm"
			placeholder="Enter your email"
			required
			disabled={submitting || validatingEmail}
		/>
	</div>

	{#if availableMethods.length === 1}
		<!-- Single method available -->
		<button
			type="button"
			onclick={() => handleMethodClick(availableMethods[0])}
			class="btn preset-filled w-full"
			disabled={submitting || validatingEmail || !email}
		>
			{validatingEmail ? 'Verifying...' : getSingleMethodButtonText()}
		</button>
	{:else}
		<!-- Multiple methods available -->
		<div class="flex flex-col gap-2">
			{#if availableMethods.includes('password')}
				<button
					type="button"
					onclick={() => handleMethodClick('password')}
					class="btn preset-filled w-full"
					disabled={submitting || validatingEmail || !email}
				>
					{validatingEmail ? 'Verifying...' : 'Continue with Password'}
				</button>
			{/if}

			{#if availableMethods.includes('emailOTP')}
				<button
					type="button"
					onclick={() => handleMethodClick('emailOTP')}
					class="btn preset-tonal w-full"
					disabled={submitting || !email}
				>
					Continue with Email OTP
				</button>
			{/if}

			{#if availableMethods.includes('magicLink')}
				<button
					type="button"
					onclick={() => handleMethodClick('magicLink')}
					class="btn preset-tonal w-full"
					disabled={submitting || !email}
				>
					Continue with Magic Link
				</button>
			{/if}
		</div>
	{/if}
</div>
