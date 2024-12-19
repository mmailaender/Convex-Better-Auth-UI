<script lang="ts">
	import { onMount } from 'svelte';
	import SocialProvider from '../social/provider.svelte';
	import { createChallenge } from '$lib/auth/passkeys/webauthn';
	import { encodeBase64 } from '@oslojs/encoding';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let passkeyAvailable = false;
	let errorMessage = '';

	// Check if a user-verifying platform authenticator (passkey) is available on page load
	onMount(async () => {
		const urlParams = new URLSearchParams($page.url.searchParams);
		errorMessage = urlParams.get('error') || '';

		if (errorMessage) {
			errorMessage = decodeURIComponent(errorMessage);
		}

		if (
			window.PublicKeyCredential &&
			(await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
		) {
			// Passkey available, ask user if they want to sign in with it
			passkeyAvailable = true;
		}
	});

	async function signInWithPasskey() {
		try {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: 'required'
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				errorMessage = 'Failed to retrieve credential.';
				return;
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				errorMessage = 'Unexpected error: invalid credential response.';
				return;
			}

			const response = await fetch('/sign-in/passkey', {
				method: 'POST',
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto('/');
			} else {
				errorMessage = await response.text();
			}
		} catch (err: any) {
			errorMessage = err?.message ?? 'An unknown error occurred.';
		}
	}

	const verifyEmail = () => {
	};
</script>

<div class="card flex w-full max-w-md flex-col gap-6 border p-6 text-center border-surface-200-800">
	<!-- Title -->
	<div id="auth_sign-in_title" class="flex flex-col gap-3">
		<h2 class="h3 text-center">Sign in or create account</h2>
		<p class="text-center text-surface-600-400">Get started for free</p>
	</div>

	<!-- Social Sign-In -->
	<SocialProvider />

	<!-- Divider -->
	<div class="flex items-center">
		<hr class="hr" />
		<div class="mx-4 text-surface-500">OR</div>
		<hr class="hr" />
	</div>

	<!-- Prompt for Passkey if available -->
	{#if passkeyAvailable}
		<div class="flex flex-col items-center gap-2">
			<p>A passkey is available. Would you like to sign in with it?</p>
			<button class="btn w-full preset-filled" on:click={signInWithPasskey}
				>Sign in with passkey</button
			>
		</div>
	{:else}
		<label class="label flex flex-col items-start">
			<span class="label-text">Email</span>
			<input type="email" placeholder="example@gmail.com" class="input w-full" />
		</label>
	{/if}

	<p class="text-center text-xs">
		By continuing, you agree to our <a href="#" class="anchor">Terms of Service</a> and
		<a href="#" class="anchor">Privacy Policy</a>.
	</p>

	{#if errorMessage}
		<p class="text-error-500">{errorMessage}</p>
	{/if}
</div>
