<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import type { ActionResult } from '@sveltejs/kit';
	import type { User } from '$lib/db/schema/types/custom';
	import type { Document } from '$lib/db/schema/types/system';

	// Skeleton UI
	import { Avatar, Modal } from '@skeletonlabs/skeleton-svelte';

	// Custom imports
	import {
		cancelEmailVerification,
		addEmail,
		deleteEmail,
		setPrimaryEmail,
		deleteAccount
	} from './user';
	import { createCredentials } from './passkeys/client';
	import { encodeBase64 } from '@oslojs/encoding';
	import { bigEndian } from '@oslojs/binary';
	import { getAccountIcon, Github } from './social/icons';
	import { TriangleAlert } from 'lucide-svelte';

	// Grab user & accessToken from SSR data.
	let user: Document<User> = $state(JSON.parse(page.data.user));
	const accessToken = page.data.accessToken;

	// Local UI state.
	let isEditingUsername = $state(false);
	let isAddingNewEmail = $state(false);
	let showConnectOptions = $state(false);
	let isShowingDeleteAccountModal = $state(false);

	let otp = $state('');

	// Basic feedback messages.
	let successMessage = $state('');
	let errorMessage = $state('');

	/**
	 * Simple helpers for showing feedback.
	 * In production, you might want a more sophisticated toast system.
	 */
	function notifySuccess(msg: string) {
		successMessage = msg;
		errorMessage = '';
	}

	function notifyError(msg: string) {
		errorMessage = msg;
		successMessage = '';
	}

	/**
	 * Unified fetch helper to reduce boilerplate.
	 */
	async function callForm({
		url,
		method = 'POST',
		data
	}: {
		url: string;
		method?: string;
		data?: Record<string, string> | URLSearchParams;
	}) {
		try {
			const headers: Record<string, string> = {
				'Content-Type': 'application/x-www-form-urlencoded'
			};

			const body =
				data instanceof URLSearchParams
					? data.toString()
					: data
						? new URLSearchParams(data).toString()
						: undefined;

			const response = await fetch(url, {
				method,
				headers,
				body
			});

			console.log('response: ', response)
			if (!response.ok) {
				const body = await response.json();
				throw new Error(`${body.error.message}`);
			}

			return await response.json();
		} catch (err: any) {
			notifyError(err?.message || 'An unknown error occurred.');
			throw err;
		}
	}

	/**
	 * Called automatically after SvelteKit form submission for user data.
	 * On success, close the edit form.
	 */
	function handleUserDataSubmit() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				isEditingUsername = false;
				notifySuccess('Profile updated successfully!');
			} else if (result.type === 'error') {
				notifyError(`Failed to update profile: ${result.error}`);
			}
		};
	}

	/**
	 * Called automatically after SvelteKit form submission for adding a new email (to be verified).
	 */
	function handleVerifyEmail() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				// The backend returns the email in `result.data?.newEmail`
				user.emailVerification = result.data?.newEmail;
				isAddingNewEmail = false;
				notifySuccess('Verification email sent!');
			} else if (result.type === 'error') {
				notifyError(`Failed to verify email: ${result.error}`);
			}
		};
	}

	/**
	 * Once the user receives an OTP, confirm it.
	 */
	async function handleVerifyOtp() {
		try {
			const updatedUser = await addEmail(accessToken, user.emailVerification!, otp);
			user.emails = updatedUser.emails;
			user.emailVerification = updatedUser.emailVerification;
			notifySuccess('Email verified successfully!');
		} catch (error) {
			notifyError('Error verifying OTP.');
		}
	}

	async function handleMakePrimary(email: string) {
		try {
			const { primaryEmail } = await setPrimaryEmail(accessToken, email);
			user.primaryEmail = primaryEmail;
			notifySuccess(`"${email}" is now your primary email.`);
		} catch (error) {
			notifyError('Error making email primary.');
		}
	}

	async function handleDeleteEmail(email: string) {
		try {
			const { emails } = await deleteEmail(accessToken, email);
			user.emails = emails;
			notifySuccess(`Deleted email "${email}".`);
		} catch (error) {
			notifyError(`Error deleting email "${email}".`);
		}
	}

	async function handleResendVerification(email: string) {
		await callForm({
			url: '/user-profile?/verifyEmail',
			data: { email, userId: user.id }
		});
		notifySuccess('Verification code resent.');
	}

	async function handleCancelVerification(email: string) {
		try {
			await cancelEmailVerification(accessToken, email);
			user.emailVerification = undefined;
			notifySuccess(`Canceled verification for "${email}".`);
		} catch (error) {
			notifyError('Error canceling verification.');
		}
	}

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

			const responseJson = await callForm({
				url: '/user-profile?/createPasskeyAccount',
				data: {
					userId: user.id,
					encodedAttestationObject: encodedAttestation,
					encodedClientDataJSON: encodedClientData
				}
			});
			
			// The server might double-encode; adjust if needed
			const account = JSON.parse(JSON.parse(responseJson.data).at(-1));
			user.accounts.push(account);

			showConnectOptions = false;
			notifySuccess('Passkey account created successfully!');
		} catch (error) {
			// Handled by callApi or catch
		}
	}

	async function handleDeleteAccount(accountId: string) {
		try {
			await deleteAccount(accessToken, accountId);
			user.accounts = user.accounts.filter((account) => account.id !== accountId);
			notifySuccess('Account disconnected.');
		} catch (error) {
			notifyError('Error deleting connected account.');
		}
	}

	/**
	 * Delete the entire user from the system.
	 */
	async function handleDeleteUser(userId: string) {
		try {
			const response = await fetch(`/api/auth/user/${userId}/delete`, {
				method: 'DELETE'
			});

			if (response.redirected) {
				isShowingDeleteAccountModal = false;
				goto(response.url);
			} else {
				notifyError('Failed to delete user account.');
			}
		} catch (error) {
			notifyError('Error deleting user account.');
		}
	}

	/**
	 * Reactive helpers to keep the template simpler.
	 */
	const hasPasskey = $derived(user.accounts.some((acc) => acc.passkey));
	const hasGithub = $derived(user.accounts.some((acc) => acc.socialProvider?.name === 'Github'));

	/**
	 * Return a "sorted" array of emails so the primary is always first.
	 */
	const sortedEmails = $derived([
		user.primaryEmail,
		...user.emails.filter((e) => e !== user.primaryEmail)
	]);
</script>

<!-- Feedback Messages -->
{#if successMessage}
	<div
		class="card grid grid-cols-1 items-center gap-4 p-4 preset-outlined-success-500 lg:grid-cols-[1fr_auto]"
	>
		<div>
			<p class="font-bold">Success</p>
			<p class="opacity-60 type-scale-1">{successMessage}</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled" onclick={() => (successMessage = '')}
				>Dismiss</button
			>
		</div>
	</div>
{/if}

{#if errorMessage}
	<div
		class="card grid grid-cols-1 items-center gap-4 p-4 preset-outlined-error-500 lg:grid-cols-[auto_1fr_auto]"
	>
		<TriangleAlert />
		<div>
			<p class="font-bold">Error</p>
			<p class="opacity-60 type-scale-1">{errorMessage}</p>
		</div>
		<div class="flex gap-1">
			<button class="btn preset-tonal hover:preset-filled" onclick={() => (errorMessage = '')}>Dismiss</button>
		</div>
	</div>
{/if}

<div
	class="mx-auto flex w-full max-w-4xl flex-col rounded-container shadow-lg bg-surface-100-900 md:flex-row"
>
	<!-- Sidebar -->
	<aside
		class="w-full rounded-l-container border-r p-6 bg-surface-200-800 border-surface-400-600 md:w-1/4"
	>
		<ul>
			<li class="mb-4 font-semibold text-surface-800-200">Account</li>
			<li class="text-surface-600-400">Profile</li>
			<li class="mt-4 text-surface-800-200">Security</li>
		</ul>
	</aside>

	<!-- Profile Content -->
	<div class="w-full p-6 md:w-3/4">
		<div class="mb-6 flex items-center justify-between">
			<h2 class="text-lg font-bold text-surface-800-200">Profile details</h2>
		</div>

		<!-- Profile Info -->
		<div class="mb-6 flex items-center gap-4">
			<Avatar src={user.avatar} name={user.firstName + ' ' + user.lastName} size="size-16" />
			{#if !isEditingUsername}
				<!-- Display Names -->
				<button onclick={() => (isEditingUsername = true)}>
					<span class="font-medium text-surface-800-200">{user.firstName}</span>
					<span class="font-medium text-surface-800-200">{user.lastName}</span>
				</button>
			{:else}
				<!-- Edit Names Form -->
				<form action="/user-profile?/profileData" method="POST" use:enhance={handleUserDataSubmit}>
					<div class="flex flex-col gap-2">
						<div class="flex gap-2">
							<input type="text" name="firstName" class="input" bind:value={user.firstName} />
							<input type="text" name="lastName" class="input" bind:value={user.lastName} />
						</div>
						<div class="flex gap-2">
							<button type="submit" class="variant-filled btn">Save</button>
							<button
								type="button"
								class="variant-ghost btn"
								onclick={() => (isEditingUsername = false)}
							>
								Cancel
							</button>
						</div>
					</div>
				</form>
			{/if}
		</div>

		<!-- Email Addresses -->
		<div class="mb-6">
			<h3 class="mb-4 font-bold text-surface-800-200">Email addresses</h3>

			<ul class="mb-4 flex flex-col gap-2">
				{#each sortedEmails as email}
					<li class="flex items-center justify-between">
						<div class="text-surface-800-200">
							{email}
							{#if email === user.primaryEmail}
								<span class="ml-2 text-sm font-semibold text-primary-500">Primary</span>
							{:else}
								<div class="mt-1 flex gap-2">
									<button
										class="btn text-sm hover:preset-tonal-surface"
										onclick={() => handleMakePrimary(email)}
									>
										Make Primary
									</button>
									<button
										class="btn text-sm hover:preset-tonal-surface"
										onclick={() => handleDeleteEmail(email)}
									>
										Delete
									</button>
								</div>
							{/if}
						</div>
					</li>
				{/each}
			</ul>

			<!-- If there's no ongoing verification, allow adding new email -->
			{#if !user.emailVerification}
				{#if !isAddingNewEmail}
					<button class="btn" onclick={() => (isAddingNewEmail = true)}> Add a new email </button>
				{:else}
					<form
						action="/user-profile?/verifyEmail"
						method="POST"
						use:enhance={handleVerifyEmail}
						class="flex gap-2"
					>
						<input type="email" name="email" placeholder="New email" class="input" required />
						<input type="text" name="userId" value={user.id} required hidden />
						<button type="submit" class="btn">Add</button>
						<button type="button" class="btn" onclick={() => (isAddingNewEmail = false)}>
							Cancel
						</button>
					</form>
				{/if}
			{/if}
		</div>

		<!-- Verification Flow -->
		{#if user.emailVerification}
			<div class="mb-6">
				<div>
					<span class="text-surface-800-200">{user.emailVerification}</span>
					<span class="badge preset-tonal-surface">Unverified</span>
				</div>

				<div class="mt-2 w-full max-w-sm rounded-lg border p-6 shadow-md border-surface-300-700">
					<h2 class="text-lg font-semibold text-surface-900-100">Verify email address</h2>
					<p class="mt-1 text-sm text-surface-600-400">
						Enter the verification code sent to
						<span class="font-medium text-surface-900-100">{user.emailVerification}</span>
					</p>

					<div class="mt-4 flex justify-between space-x-1">
						<input type="text" class="input" bind:value={otp} />
					</div>

					<div class="mt-4">
						<button
							class="anchor text-sm"
							onclick={() => handleResendVerification(user.emailVerification!)}
						>
							Didn't receive a code? Resend
						</button>
					</div>

					<div class="mt-6 flex justify-end gap-2 text-sm">
						<button
							class="btn hover:preset-tonal-surface"
							onclick={() => handleCancelVerification(user.emailVerification!)}
						>
							Cancel
						</button>
						<button class="btn preset-filled-primary-500" onclick={handleVerifyOtp}>
							Verify
						</button>
					</div>
				</div>
			</div>
		{/if}

		<!-- Connected Accounts -->
		<div>
			<h3 class="mb-4 font-bold text-surface-800-200">Connected accounts</h3>
			<ul>
				{#each user.accounts as account}
					{@const accountProvider = account.socialProvider?.name || 'Passkey'}
					{@const AccountIcon = getAccountIcon(accountProvider)}

					<li class="mb-2 flex items-center justify-between">
						<span class="flex items-center text-surface-800-200">
							<AccountIcon
								class={['mr-2 size-5', account.socialProvider && 'fill-surface-950-50']}
							/>
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

			<!-- Show connect button only if missing passkey or GitHub -->
			{#if !(hasPasskey && hasGithub)}
				<button
					class="mt-2 text-primary-500 hover:underline"
					onclick={() => (showConnectOptions = !showConnectOptions)}
				>
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
								<Github class="size-5 fill-surface-950-50" />
								GitHub
							</a>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Delete Entire Account -->
		<div class="mt-8 flex justify-end">
			<Modal
				bind:open={isShowingDeleteAccountModal}
				triggerBase="btn text-error-500 hover:preset-tonal-error-500"
				contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm"
				backdropClasses="backdrop-blur-sm"
			>
				{#snippet trigger()}Delete account{/snippet}
				{#snippet content()}
					<header class="flex justify-between">
						<h2 class="h2">Delete your account</h2>
					</header>
					<article>
						<p class="opacity-60">
							Are you sure you want to delete your account? All of your data will be permanently
							deleted.
						</p>
					</article>
					<footer class="flex justify-end gap-4">
						<button
							type="button"
							class="btn preset-tonal"
							onclick={() => (isShowingDeleteAccountModal = false)}
						>
							Cancel
						</button>
						<button
							type="button"
							class="btn preset-filled-error-500"
							onclick={() => handleDeleteUser(user.id)}
						>
							Confirm
						</button>
					</footer>
				{/snippet}
			</Modal>
		</div>
	</div>
</div>
