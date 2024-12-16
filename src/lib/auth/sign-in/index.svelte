<script lang="ts">
	import { onMount } from 'svelte';
	import SocialProvider from '../social/provider.svelte';
	import { createChallenge } from "$lib/auth/passkeys/webauthn";
	import { encodeBase64 } from "@oslojs/encoding";
	import { goto } from "$app/navigation";

	let passkeyErrorMessage = "";
	let showPasskeyPrompt = false;

	// Check if a user-verifying platform authenticator (passkey) is available on page load
	onMount(async () => {
		if (window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()) {
			// Passkey available, ask user if they want to sign in with it
			showPasskeyPrompt = true;
		}
	});

	async function signInWithPasskey() {
		try {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "required"
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				passkeyErrorMessage = "Failed to retrieve credential.";
				return;
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				passkeyErrorMessage = "Unexpected error: invalid credential response.";
				return;
			}

			const response = await fetch("/sign-in/passkey", {
				method: "POST",
				body: JSON.stringify({
					credential_id: encodeBase64(new Uint8Array(credential.rawId)),
					signature: encodeBase64(new Uint8Array(credential.response.signature)),
					authenticator_data: encodeBase64(new Uint8Array(credential.response.authenticatorData)),
					client_data_json: encodeBase64(new Uint8Array(credential.response.clientDataJSON))
				})
			});

			if (response.ok) {
				goto("/");
			} else {
				passkeyErrorMessage = await response.text();
			}
		} catch (err: any) {
			passkeyErrorMessage = err?.message ?? "An unknown error occurred.";
		}
	}

	const handleEmailLogin = () => {
		// Implement email-based login or other methods if desired
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
	{#if showPasskeyPrompt}
		<div class="flex flex-col items-center gap-2">
			<p>A passkey is available. Would you like to sign in with it?</p>
			<button class="btn w-full preset-filled" on:click={signInWithPasskey}>Sign in with passkey</button>
			<button class="btn w-full preset-ghost" on:click={() => showPasskeyPrompt = false}>Use another method</button>
		</div>
	{:else}
		<!-- If user chose not to use passkey or no passkey is available, show normal login flow -->
		<div id="auth_passkey-login" class="flex flex-col gap-4">
			<label class="label flex flex-col items-start">
				<span class="label-text">Email</span>
				<input type="email" placeholder="example@gmail.com" class="input w-full" />
			</label>
			<button class="btn w-full preset-filled" on:click={handleEmailLogin}>Continue</button>
			<!-- If you'd like, you can also place a passkey sign-in button here as a fallback -->
			<!-- <button class="btn w-full" on:click={signInWithPasskey}>Sign in with passkey</button> -->
		</div>
	{/if}

	<p class="text-center text-xs">
		By continuing, you agree to our <a href="#" class="anchor">Terms of Service</a> and
		<a href="#" class="anchor">Privacy Policy</a>.
	</p>

	{#if passkeyErrorMessage}
		<p class="text-red-500">{passkeyErrorMessage}</p>
	{/if}
</div>
