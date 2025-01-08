<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import SocialProvider from '$lib/auth/social/provider.svelte';
	import { createChallenge } from '$lib/auth/passkeys/client';
	import { encodeBase64 } from '@oslojs/encoding';
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
		const urlParams = new URLSearchParams($page.url.searchParams);
		errorMessage = urlParams.get('error') || '';
		if (errorMessage) {
			errorMessage = decodeURIComponent(errorMessage);
		}
	});

	$effect(() => {
		if (userExists) {
			signInWithPasskey();
		}
	});

	async function verifyEmail(event: SubmitEvent) {
		event.preventDefault();
		try {
			const res = await fetch(`/api/auth/webauthn/verify-email?email=${encodeURIComponent(email)}`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!res.ok) {
				const errorMessage = await res.text();
				throw new Error(errorMessage);
			}
			const { exists } = await res.json();
			userExists = exists;
		} catch (err: any) {
			errorMessage = err?.message ?? 'Error verifying email.';
		}
	}

	function getFriendlyErrorMessage(error: any): string {
        switch (error.name) {
            case 'NotAllowedError':
                return 'Authentication was canceled or timed out. Please try again.';
            case 'InvalidStateError':
                return 'There was an issue with the authentication state. Please refresh the page and try again.';
            case 'AbortError':
                return 'Authentication was aborted. Please try again.';
            default:
                return error.message || 'An unexpected error occurred. Please try again.';
        }
    }

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
                headers: { 'Content-Type': 'application/json' },
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
            errorMessage = getFriendlyErrorMessage(err);
        }
    }

	async function signUpWithPasskey(event: SubmitEvent) {
		event.preventDefault();

		try {
			const challenge = await createChallenge();
			const credential = await navigator.credentials.create({
				publicKey: {
					challenge,
					user: {
						displayName: firstName + ' ' + lastName,
						id: data.credentialUserId,
						name: email
					},
					rp: {
						name: 'Your App Name'
					},
					pubKeyCredParams: [
						{
							alg: -7,
							type: 'public-key'
						},
						{
							alg: -257,
							type: 'public-key'
						}
					],
					attestation: 'none',
					authenticatorSelection: {
						userVerification: 'required',
						residentKey: 'required',
						requireResidentKey: true
					}
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error('Failed to create public key credential.');
			}
			if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
				throw new Error('Unexpected error: invalid credential response.');
			}

			const attestationObject = encodeBase64(new Uint8Array(credential.response.attestationObject));
			const clientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON));

			// Send data to sign-up endpoint
			const response = await fetch('/api/auth/webauthn/passkey/sign-up', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName,
					lastName,
					email,
					otp,
					userId: data.userId,
					encodedAttestationObject: attestationObject,
					encodedClientDataJSON: clientDataJSON
				})
			});

			if (!response.ok) {
				const msg = await response.text();
				throw new Error(msg || 'Failed to sign up with passkey.');
			}

			goto('/');
		} catch (err: any) {
			errorMessage = getFriendlyErrorMessage(err);
		}
	}
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

		<!-- If user existence not checked or if user doesn't exist yet, show email form -->
		{#if userExists === null}
			<form class="flex flex-col gap-3" onsubmit={verifyEmail}>
				<input
					class="input"
					type="email"
					bind:value={email}
					placeholder="Enter your email"
					required
				/>
				<button class="btn w-full preset-filled" type="submit">Continue</button>
			</form>
		{/if}

		<!-- If user exists, show passkey sign-in -->
		{#if userExists === true}
			<div class="flex flex-col items-center gap-2">
				<button class="btn w-full preset-filled" onclick={signInWithPasskey}>
					Continue with passkey
				</button>
			</div>
		{/if}

		<!-- If user does not exist, show sign-up fields -->
		{#if userExists === false}
			<form class="flex flex-col gap-3" onsubmit={signUpWithPasskey} autocomplete="off">
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

				<button class="btn w-full preset-filled" type="submit"> Create Passkey and Sign Up </button>
			</form>
		{/if}

		<p class="text-center text-xs">
			By continuing, you agree to our <a href="#" class="anchor">Terms of Service</a> and
			<a href="#" class="anchor">Privacy Policy</a>.
		</p>

		{#if errorMessage}
			<p class="text-error-500">{errorMessage}</p>
		{/if}
	</div>
</div>
