<script lang="ts">
	import { page } from '$app/state';
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';
	import type { User } from '$lib/db/schema/types/custom';
	import type { Document } from '$lib/db/schema/types/system';

	// Skeleton UI
	import { Avatar } from '@skeletonlabs/skeleton-svelte';

	// Custom imports
	import { getSocialIcon } from './social/icons';
	import { cancelEmailVerification, addEmail, deleteEmail, setPrimaryEmail } from './user';



	// Pull the user from SSR data:
	let user: Document<User> | null = $state(page.data.user ? JSON.parse(page.data.user) : null);

	// Local state
	let isEditingUsername = $state(false);
	let isAddingNewEmail = $state(false);
	let otp = $state('');

	/**
	 * Handle updating basic user info (first name, last name, etc.).
	 */
	function handleUserDataSubmit() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				isEditingUsername = false;
			}
		};
	}

	/**
	 * Submit form to start verification of a newly added email.
	 * On success, we store the verification email in `user.emailVerification`.
	 */
	function handleVerifyEmail() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				user!.emailVerification = result.data?.newEmail;
				isAddingNewEmail = false;
			}
		};
	}

	/**
	 * Once the user gets an OTP via email, we confirm it here.
	 */
	async function handleVerifyOtp() {
		try {
			const updatedUser = await addEmail(page.data.accessToken, user.emailVerification, otp);

			// Update local user data
			user.emails = updatedUser.emails;
			user.emailVerification = updatedUser.emailVerification;
		} catch (error) {
			console.error('Error verifying OTP:', error);
		}
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
	 * Delete an existing email (not allowed if it's already the primary).
	 */
	async function handleDeleteEmail(email: string) {
		try {
			const { emails } = await deleteEmail(page.data.accessToken, email);
			user.emails = emails;
		} catch (error) {
			console.error('Error deleting email:', error);
		}
	}

	/**
	 * Resend the verification code to the email currently in user.emailVerification.
	 * Sends form-encoded data including email and userId.
	 */
	async function handleResendVerification(email: string) {
		try {
			const formData = new URLSearchParams();
			formData.append('email', email);
			formData.append('userId', user.id);

			const response = await fetch('/user-profile?/verifyEmail', {
				method: 'POST',
				body: formData.toString(),
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded'
				}
			});

			if (!response.ok) {
				throw new Error(`Error resending verification: ${response.statusText}`);
			}

			// TODO: Optionally, show a success notification here
			console.log('Verification email resent successfully.');
		} catch (error) {
			console.error('Error resending verification:', error);
			// Optionally, show an error notification here
		}
	}

	/**
	 * Cancel the verification process for the active unverified email.
	 */
	async function handleCancelVerification(email: string) {
		try {
			await cancelEmailVerification(page.data.accessToken, email);
			user.emailVerification = undefined;
		} catch (error) {
			console.error('Error canceling verification:', error);
		}
	}
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
					<!-- Display Names -->
					<button onclick={() => (isEditingUsername = true)}>
						<span class="font-medium text-surface-800-200">{user.firstName}</span>
						<span class="font-medium text-surface-800-200">{user.lastName}</span>
					</button>
				{:else}
					<!-- Edit Names Form -->
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

				<!-- List of existing emails: primary first, then others -->
				<ul class="mb-4 flex flex-col gap-2">
					{#each [user.primaryEmail, ...user.emails.filter((email) => email !== user.primaryEmail)] as email}
						<li class="flex items-center justify-between">
							<div class="text-surface-800-200">
								{email}
								{#if email === user.primaryEmail}
									<span class="ml-2 text-sm font-semibold text-primary-500">Primary</span>
								{:else}
									<div class="flex gap-2">
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

				<!-- If there's no ongoing verification, let user add a new email -->
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
							<button type="submit" class="btn">Add</button>
							<button type="button" class="btn" onclick={() => (isAddingNewEmail = false)}>
								Cancel
							</button>
						</form>
					{/if}
				{/if}
			</div>

			<!-- If there's an email waiting to be verified, show the verification flow -->
			{#if user.emailVerification}
				<div class="mb-6">
					<div>
						<span class="text-surface-800-200">{user.emailVerification}</span>
						<span class="badge preset-tonal-surface">Unverified</span>
					</div>
					<div class="w-full max-w-sm rounded-lg border p-6 shadow-md border-surface-300-700">
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

						<div class="mt-6 flex justify-end text-sm">
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
						{#if account.socialProvider}
							{@const SocialIcon = getSocialIcon(account.socialProvider.name)}
							<li class="mb-2 flex items-center justify-between">
								<span class="flex items-center text-surface-800-200">
									<SocialIcon
										class="size-5 fill-surface-950-50 mr-2"
									/>
									{account.socialProvider.name} • {account.socialProvider.email}
								</span>
							</li>
						{/if}
					{/each}
				</ul>
				<button class="mt-2 text-primary-500 hover:underline"> + Connect account </button>
			</div>
		</div>
	</div>
{/if}
