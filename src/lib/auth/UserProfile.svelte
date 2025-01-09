<script lang="ts">
	import { page } from '$app/state';
	import type { ActionResult } from '@sveltejs/kit';
	import { onMount } from 'svelte';
	import { enhance } from '$app/forms';

	import type { User } from '$lib/db/schema/types/custom';
	import type { Document } from '$lib/db/schema/types/system';

	import { cancelEmailVerification, addEmail, deleteEmail, setPrimaryEmail } from './user';
	import socialIcons, { type SocialIcons } from './social/icons';
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	let getSocialIcon = ({ name }: { name: keyof SocialIcons }) => socialIcons[name];

	let user: Document<User> | null = $state(page.data.user ? JSON.parse(page.data.user) : null);
	// let user: Document<User> | null = $derived(page.data.user ? JSON.parse(page.data.user) : null);

	// Local state
	let isEditingUsername = $state(false);
	let isAddingNewEmail = $state(false);

	/**
	 * Form: handle user profile info (first/last name, avatar, etc.)
	 */
	function handleUserDataSubmit() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				isEditingUsername = false;
			}
		};
	}

	/**
	 * Submit form to add a new email (and start its verification).
	 * This might call your existing `verifyEmail` action
	 * or a new action (depending on how you want to set it up).
	 */
	async function handleVerifyEmail() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				user!.emailVerification = result.data?.newEmail;
				isAddingNewEmail = false;
			}
		};
	}

	/**
	 * Make an existing email the new primary.
	 */
	async function handleMakePrimary(email: string) {
		try {
			const { primaryEmail } = await setPrimaryEmail(page.data.accessToken, email);
			user.primaryEmail = primaryEmail;
		} catch (error) {
			console.error('Error making primary:', error);
		}
	}

	/**
	 * Delete an existing email (cannot delete if it's primary).
	 */
	async function handleDeleteEmail(email: string) {
		try {
			const {emails} = await deleteEmail(page.data.accessToken, email);

			user.emails = emails;
		} catch (error) {
			console.error('Error deleting email:', error);
		}
	}

	/**
	 * Resend verification for an active verification email.
	 */
	async function handleResendVerification(email: string) {
		try {
			await fetch('/user-profile?/verifyEmail', {
				method: 'POST',
				body: JSON.stringify({ email }),
				headers: {
					'Content-Type': 'application/json'
				}
			});
			// Possibly show a notification or toast on success
		} catch (error) {
			console.error('Error resending verification:', error);
		}
	}

	/**
	 * Cancel verification process for an active verification email.
	 * You’d need to define how to handle “cancel” on the back end.
	 */
	async function handleCancelVerification(email: string) {
		try {
			console.log("AccessToken: ", page.data.accessToken)
			await cancelEmailVerification(page.data.accessToken, email);
			user.emailVerification = undefined;
		} catch (error) {
			console.error('Error canceling verification:', error);
		}
	}

	onMount(async () => {
		// Read the "otp" parameter from the URL
		const otp = page.url.searchParams.get('otp');
		if (otp && user?.emailVerification) {
			try {
				// Call addEmail() with the current user's verification email + the OTP
				// “accessToken” is retrieved from page.data where you saved it in +page.server.ts
				const updatedUser = await addEmail(page.data.accessToken, user.emailVerification, otp);

				// Update local user data with the response
				user.emails = updatedUser.emails;
				user.emailVerification = updatedUser.emailVerification;

				// Remove the `otp` param from the URL to clean things up
				const url = new URL(window.location.href);
				url.searchParams.delete('otp');
				history.replaceState({}, '', url.toString());
			} catch (error) {
				console.error('Error verifying email with OTP:', error);
			}
		}
	});
</script>

{#if user}
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
					<button onclick={() => (isEditingUsername = true)}>
						<span class="font-medium text-surface-800-200">{user.firstName}</span>
						<span class="font-medium text-surface-800-200">{user.lastName}</span>
					</button>
				{:else}
					<form
						action="/user-profile?/profileData"
						method="POST"
						use:enhance={handleUserDataSubmit}
					>
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

				<!-- List of existing emails -->
				<ul class="mb-4 flex flex-col gap-2">
					{#each user.emails as email}
						<li class="flex items-center justify-between">
							<div class="text-surface-800-200">
								{email}
								{#if email === user.primaryEmail}
									<span class="ml-2 text-sm font-semibold text-primary-500"> Primary </span>
								{:else}
									<div class="flex gap-2">
										<button
											class="variant-ghost btn text-sm"
											onclick={() => handleMakePrimary(email)}
										>
											Make Primary
										</button>
										<button
											class="variant-outlined btn text-sm"
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

				<!-- Form to add a new email -->
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
							<input
								type="email"
								name="email"
								placeholder="Add a new email address"
								class="input"
								required
							/>
							<input type="text" name="userId" value={user.id} required hidden />
							<button type="submit" class="btn"> Add </button>
							<button type="button" class="btn" onclick={() => (isAddingNewEmail = false)}>
								Cancel
							</button>
						</form>
					{/if}
				{/if}
			</div>

			<!-- Emails in active verification process -->
			{#if user.emailVerification}
				<div class="mb-6">
					<h4 class="mb-2 font-semibold text-surface-800-200">Pending verifications</h4>
					<ul class="flex flex-col gap-2">
							<li class="flex items-center justify-between">
								<span class="text-surface-800-200">{user.emailVerification}</span>
								<div class="flex gap-2">
									<button
										class="variant-ghost btn text-sm"
										onclick={() => handleResendVerification(user.emailVerification!)}
									>
										Resend
									</button>
									<button
										class="variant-outlined btn text-sm"
										onclick={() => handleCancelVerification(user.emailVerification!)}
									>
										Cancel
									</button>
								</div>
							</li>
					</ul>
				</div>
			{/if}

			<!-- Connected Accounts -->
			<div>
				<h3 class="mb-4 font-bold text-surface-800-200">Connected accounts</h3>
				<ul>
					{#each user.accounts as account}
						{#if account.socialProvider}
							<li class="mb-2 flex items-center justify-between">
								<span class="flex items-center text-surface-800-200">
									{getSocialIcon(account.socialProvider.name)}
									{account.socialProvider.name} • {account.socialProvider.email}
								</span>
							</li>
						{/if}
					{/each}
				</ul>
				<button class="mt-2 text-primary-500 hover:underline">+ Connect account</button>
			</div>
		</div>
	</div>
{/if}
