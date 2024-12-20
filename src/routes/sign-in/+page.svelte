<script lang="ts">
	import { onMount } from 'svelte';
	import SocialProvider from '$lib/auth/social/provider.svelte';
	import { createChallenge } from '$lib/auth/passkeys/webauthn';
	import { encodeBase64 } from '@oslojs/encoding';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	// let passkeyAvailable = false;
	let errorMessage = $state('');

	// Check if a user-verifying platform authenticator (passkey) is available on page load
	onMount(async () => {
		const urlParams = new URLSearchParams($page.url.searchParams);
		errorMessage = urlParams.get('error') || '';

		if (errorMessage) {
			errorMessage = decodeURIComponent(errorMessage);
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

			const response = await fetch('/api/auth/webauthn/passkey/sign-in', {
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

	const verifyEmail = () => {};
</script>

<div class="flex min-h-screen items-center justify-center">
	<div
		class="card flex w-full max-w-md flex-col gap-6 border p-6 text-center border-surface-200-800"
	>
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
		<!-- {#if passkeyAvailable} -->
		<div class="flex flex-col items-center gap-2">
			<!-- <button class="btn w-full preset-filled" onclick={(e) => signInWithPasskey(errorMessage).catch((err) => console.error(err))}>
					Continue with passkey
				  </button> -->
			<button class="btn w-full preset-filled" onclick={signInWithPasskey}>
				Continue with passkey
			</button>
		</div>
		<!-- {/if} -->

		<p class="text-center text-xs">
			By continuing, you agree to our <a href="#" class="anchor">Terms of Service</a> and
			<a href="#" class="anchor">Privacy Policy</a>.
		</p>

		{#if errorMessage}
			<p class="text-error-500">{errorMessage}</p>
		{/if}
	</div>
</div>
