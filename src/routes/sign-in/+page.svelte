<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import { callForm } from '$lib/primitives/api/callForm';
	import { signInWithPasskey, signUpWithPasskey } from '$lib/auth/api/passkey';
	import SocialProvider from '$lib/auth/social/provider.svelte';

	import type {
		VerifyEmailAndSendVerificationReturnData,
		VerifyEmailReturnData
	} from '$lib/user/api/types';
	import { Fingerprint } from 'lucide-svelte';

	interface Props {
		data: { userId: string; credentialUserId: Uint8Array };
	}

	let { data }: Props = $props();

	let errorMessage = $state('');

	let email = $state('');
	let firstName = $state('');
	let lastName = $state('');
	let otp = $state('');

	let userExists: boolean | null = $state(null); // null means we haven't checked yet

	onMount(() => {
		const urlParams = new URLSearchParams(page.url.searchParams);
		const encodedErrorMessage = urlParams.get('error') || '';
		if (encodedErrorMessage) {
			errorMessage = decodeURIComponent(encodedErrorMessage);
			urlParams.delete('error');
			history.replaceState(null, '', '?' + urlParams.toString());
		}
	});

	$effect(() => {
		if (userExists) {
			signInWithPasskey();
		}
	});

	async function verifyEmailAndSendVerification(event: SubmitEvent) {
		event.preventDefault();
		try {
			const verificationResult = await callForm<VerifyEmailReturnData>({
				url: `/user-profile?/verifyEmailAndSendVerification`,
				data: { email }
			});

			if (!verificationResult.valid) {
				errorMessage = `Please use a valid email.`;
			} else {
				userExists = verificationResult.exists;
				errorMessage = ``;
			}

			console.log('verificationResult: ', verificationResult);
			console.log('userExists: ', userExists);
		} catch (err: any) {
			errorMessage = err?.message ?? 'Error verifying email.';
		}
	}

	async function handleSignInWithPasskey() {
		try {
			await signInWithPasskey();
		} catch (err) {
			if (err instanceof Error) {
				errorMessage = err.message;
			} else {
				errorMessage = 'An unknown error occurred.';
			}
		}
	}

	async function handleSignUpWithPasskey(event: SubmitEvent) {
		event.preventDefault();
		try {
			await signUpWithPasskey(firstName, lastName, email, otp, data.credentialUserId, data.userId);
		} catch (error: any) {
			errorMessage = error.message || 'An error occurred during sign up.';
		}
	}
</script>

<div class="flex min-h-screen items-center justify-center">
	<div
		class="card border-surface-200-800 flex w-full max-w-md flex-col gap-6 border p-6 text-center"
	>
		<!-- Title -->
		<div id="auth_sign-in_title" class="flex flex-col gap-3">
			<h2 class="h3 text-center">Sign in</h2>
		</div>

		<!-- Sign-In -->
		<SocialProvider />

		<button
			class="btn preset-filled-surface-100-900 flex items-center gap-2"
			onclick={handleSignInWithPasskey}
		>
			<Fingerprint class="text-surface-950-50" />
			Continue with Passkey
		</button>

		<!-- Divider -->
		<div class="flex items-center">
			<hr class="hr" />
			<div class="text-surface-500 mx-4">OR</div>
			<hr class="hr" />
		</div>

		{#if userExists !== true}
			<div id="auth_sign-in_title" class="flex flex-col gap-3">
				<h2 class="h3 text-center">Create account</h2>
				<p class="text-surface-600-400 text-center">Get started for free</p>
			</div>
		{/if}

		<!-- If user existence not checked or if user doesn't exist yet, show email form -->
		{#if userExists === null}
			<form class="flex flex-col gap-3" onsubmit={verifyEmailAndSendVerification}>
				<input
					class="input"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					required
				/>
				<button class="btn preset-filled w-full" type="submit">Continue</button>
			</form>
		{/if}

		<!-- If user does not exist, show sign-up fields -->
		{#if userExists === false}
			<form class="flex flex-col gap-3" onsubmit={handleSignUpWithPasskey} autocomplete="off">
				<input class="input" type="text" bind:value={firstName} placeholder="First name" required />
				<input class="input" type="text" bind:value={lastName} placeholder="Last name" required />
				<input
					class="input"
					type="text"
					bind:value={otp}
					placeholder="One time password"
					required
				/>
				<!-- email is already known, but let's keep it for clarity -->
				<input
					class="input disabled:bg-surface-100-900"
					type="email"
					bind:value={email}
					placeholder="Email"
					disabled
					required
				/>

				<button class="btn preset-filled w-full" type="submit"> Create Passkey and Sign Up </button>
			</form>
		{/if}

		{#if userExists === true}
			<div class="flex flex-col gap-3">
				<p class="text-surface-600-400 text-center">
					An account for this email already exists. Sign in instead.
				</p>
			</div>
		{/if}

		{#if userExists === false}
			<p class="text-center text-xs">
				By continuing, you agree to our <a href="/terms" class="anchor">Terms of Service</a> and
				<a href="/privacy-policy" class="anchor">Privacy Policy</a>.
			</p>
		{/if}

		{#if errorMessage}
			<p class="text-error-500">{errorMessage}</p>
		{/if}
	</div>
</div>
