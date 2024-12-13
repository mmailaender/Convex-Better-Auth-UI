<script lang="ts">
	import { createChallenge } from "$lib/auth/passkeys/webauthn";
    import { encodeBase64 } from "@oslojs/encoding";
	import { goto } from "$app/navigation";

	let passkeyErrorMessage = "";
</script>

<div>
	<button
		on:click={async () => {
			const challenge = await createChallenge();

			const credential = await navigator.credentials.get({
				publicKey: {
					challenge,
					userVerification: "required"
				}
			});

			if (!(credential instanceof PublicKeyCredential)) {
				throw new Error("Failed to create public key");
			}
			if (!(credential.response instanceof AuthenticatorAssertionResponse)) {
				throw new Error("Unexpected error");
			}

			const response = await fetch("/sign-in/passkey", {
				method: "POST",
				// this example uses JSON but you can use something like CBOR to get something more compact
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
		}}>Sign in with passkeys</button
	>
	<p>{passkeyErrorMessage}</p>
</div>