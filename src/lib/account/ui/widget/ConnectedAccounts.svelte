<script lang="ts">
	import { bigEndian } from '@oslojs/binary';
	import { encodeBase64 } from '@oslojs/encoding';

	// Lib
	import { createCredentials } from '$lib/auth/api/passkey';
	import { getAccountIcon, Github } from '$lib/auth/social/icons';
	import { callForm } from '$lib/primitives/api/callForm';

	// Types
	import type { Account, User } from '$lib/db/schema/types/custom';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let showConnectOptions = $state(false);
	let localSuccess = $state('');
	let localError = $state('');

	// Derived state: check if the user already has passkey or GitHub.
	let hasPasskey = $derived(user.accounts.some((acc) => acc.passkey));
	let hasGithub = $derived(user.accounts.some((acc) => acc.socialProvider?.name === 'Github'));

	async function handleCreatePasskeyAccount() {
		try {
			const credentialUserId = new Uint8Array(8);
			bigEndian.putUint64(credentialUserId, BigInt(user.id), 0);
			const credentials = await createCredentials(
				user.firstName,
				user.lastName,
				user.primaryEmail,
				credentialUserId
			);
			const encodedAttestation = encodeBase64(new Uint8Array(credentials.attestationObject));
			const encodedClientData = encodeBase64(new Uint8Array(credentials.clientDataJSON));

			const account = await callForm<Account>({
				url: '/user-profile?/createPasskeyAccount',
				data: {
					userId: user.id,
					encodedAttestationObject: encodedAttestation,
					encodedClientDataJSON: encodedClientData
				}
			});
			console.log('Passkey account created successfully: ', account);
			user.accounts.push(account);
			showConnectOptions = false;
			localSuccess = 'Passkey account created successfully!';
		} catch (err) {
			localError = 'Error creating passkey account.';
		}
	}

	async function handleDeleteAccount(accountId: string) {
		try {
			await callForm({
				url: '/user-profile?/deleteAccount',
				data: {
					accountId
				}
			});
			user.accounts = user.accounts.filter((account) => account.id !== accountId);
			localSuccess = 'Account disconnected.';
		} catch (error) {
			localError = 'Error deleting connected account.';
		}
	}

	function toggleConnectOptions() {
		showConnectOptions = !showConnectOptions;
		localSuccess = '';
		localError = '';
	}
</script>

<div>
	<h3 class="mb-4 font-bold text-surface-800-200">Connected accounts</h3>
	<ul>
		{#each user.accounts as account}
			{@const accountProvider = account.socialProvider?.name || 'Passkey'}
			{@const AccountIcon = getAccountIcon(accountProvider)}
			<li class="mb-2 flex items-center justify-between">
				<span class="flex items-center text-surface-800-200">
					<AccountIcon class="mr-2 size-5" />
					{accountProvider}
					{#if account.socialProvider}
						• {account.socialProvider.email}
					{/if}
				</span>
				{#if user.accounts.length > 1}
					<button
						class="btn text-sm hover:preset-tonal-surface"
						onclick={() => handleDeleteAccount(account.id)}
					>
						Delete
					</button>
				{/if}
			</li>
		{/each}
	</ul>
	{#if !(hasPasskey && hasGithub)}
		<button class="mt-2 text-primary-500 hover:underline" onclick={toggleConnectOptions}>
			+ Connect account
		</button>
	{/if}
	{#if showConnectOptions}
		<div class="card mt-2 max-w-72 border border-surface-300-700">
			<div class="flex flex-col gap-2">
				{#if !hasPasskey}
					<button class="btn hover:preset-tonal-surface" onclick={handleCreatePasskeyAccount}>
						Passkey
					</button>
				{/if}
				{#if !hasGithub}
					<a
						class="btn flex items-center gap-2 hover:preset-tonal-surface"
						href="/api/auth/oauth/github?redirect_url=%2Fuser-profile"
					>
						<Github class="size-5" />
						GitHub
					</a>
				{/if}
			</div>
		</div>
	{/if}
	{#if localSuccess}
		<p class="text-success-600-400">{localSuccess}</p>
	{/if}
	{#if localError}
		<p class="text-error-600-400">{localError}</p>
	{/if}
</div>
