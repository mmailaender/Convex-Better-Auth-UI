<script lang="ts">
	import { encodeBase64 } from '@oslojs/encoding';
	import { createChallenge } from '$lib/auth/passkeys/webauthn';
	// import { enhance } from "$app/forms";
	import { PUBLIC_APP_NAME } from '$env/static/public';

	import type { ActionData, PageData } from './$types';
	// import type { WebAuthnUserCredential } from '$lib/auth/server/webauthn';

	export let data: PageData;
	export let form: ActionData;

	let firstName = '';
	let lastName = '';
	let email = '';

	async function handleFormSubmit(event: SubmitEvent) {
		event.preventDefault(); // Prevent the default form submission

		// Step 1: Create WebAuthn challenge
		const challenge = await createChallenge();

		// Step 2: Create WebAuthn credential
		const credential = await navigator.credentials.create({
			publicKey: {
				challenge,
				user: {
					displayName: firstName + ' ' + lastName,
					id: data.credentialUserId,
					name: email
				},
				rp: {
					name: PUBLIC_APP_NAME
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
			throw new Error('Failed to create public key');
		}
		if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
			throw new Error('Unexpected error');
		}

		// Step 3: Encode the credential data
		const attestationObject = encodeBase64(new Uint8Array(credential.response.attestationObject));
		const clientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON));

		// Step 4: Populate the form and submit it
		const formElement = event.target as HTMLFormElement;
		formElement.attestation_object.value = attestationObject;
		formElement.client_data_json.value = clientDataJSON;

		formElement.submit(); // Submit the form programmatically
	}

	// let encodedAttestationObject: string | null = null;
	// let encodedClientDataJSON: string | null = null;
</script>

<h1 class="h3">Register passkey</h1>
<!-- <button
	disabled={encodedAttestationObject !== null && encodedClientDataJSON !== null}
	onclick={async () => {
		const challenge = await createChallenge();

		const credential = await navigator.credentials.create({
			publicKey: {
				challenge,
				user: {
					displayName: data.user.username,
					id: data.credentialUserId,
					name: data.user.email
				},
				rp: {
					name: "SvelteKit WebAuthn example"
				},
				pubKeyCredParams: [
					{
						alg: -7,
						type: "public-key"
					},
					{
						alg: -257,
						type: "public-key"
					}
				],
				attestation: "none",
				authenticatorSelection: {
					userVerification: "required",
					residentKey: "required",
					requireResidentKey: true
				},
				excludeCredentials: data.credentials.map((credential: WebAuthnUserCredential) => {
					return {
						id: credential.id,
						type: "public-key"
					};
				})
			}
		});

		if (!(credential instanceof PublicKeyCredential)) {
			throw new Error("Failed to create public key");
		}
		if (!(credential.response instanceof AuthenticatorAttestationResponse)) {
			throw new Error("Unexpected error");
		}

		encodedAttestationObject = encodeBase64(new Uint8Array(credential.response.attestationObject));
		encodedClientDataJSON = encodeBase64(new Uint8Array(credential.response.clientDataJSON));
	}}>Create credential</button
> -->
<!-- <form method="post" use:enhance> -->
<form method="post" onsubmit={handleFormSubmit} autocomplete="off">
	<label class="label">
		<span class="label-text">First name</span>
		<input class="input" type="text" name="firstName" bind:value={firstName} required />
	</label>
	
	<label class="label">
		<span class="label-text">Last name</span>
		<input class="input" type="text" name="lastName" bind:value={lastName} required />
	</label>
	
	<label class="label">
		<span class="label-text">Email</span>
		<input class="input" type="text" name="email" bind:value={email} required />
	</label>

	<!-- <input type="hidden" name="attestation_object" value={encodedAttestationObject} />
	<input type="hidden" name="client_data_json" value={encodedClientDataJSON} /> -->
	<input type="hidden" name="attestation_object" />
	<input type="hidden" name="client_data_json" />

	<!-- <button disabled={encodedAttestationObject === null && encodedClientDataJSON === null}>Continue</button> -->
	<button class="btn preset-filled">Create Passkey and Sign Up</button>
	<p>{form?.message ?? ''}</p>
</form>
