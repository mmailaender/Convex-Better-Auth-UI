<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionResult } from '@sveltejs/kit';

	import { callForm } from '$lib/primitives/api/callForm';

	import type { User } from '$lib/db/schema/types/custom';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let isAddingNewEmail = $state(false);
	let localSuccess = $state('');
	let localError = $state('');

	// Compute sorted emails with the primary first.
	let sortedEmails = $derived([
		user.primaryEmail,
		...user.emails.filter((e: string) => e !== user.primaryEmail)
	]);

	function addNewEmail() {
		isAddingNewEmail = true;
		localSuccess = '';
		localError = '';
	}

	function cancelNewEmail() {
		isAddingNewEmail = false;
		localSuccess = '';
		localError = '';
	}

	async function handleMakePrimary(email: string) {
		try {
			const { primaryEmail } = await callForm<User>({
				url: '/api/user?/setPrimaryEmail',
				data: { email }
			});
			user.primaryEmail = primaryEmail;
			localSuccess = `"${email}" is now your primary email.`;
		} catch (err) {
			if (err instanceof Error) {
				localError = err.message;
			}
			localError = 'Unknown error. Please try again. If it persists, contact support.';
		}
	}

	async function handleDeleteEmail(email: string) {
		try {
			const { emails } = await callForm<User>({
				url: '/api/user?/deleteEmail',
				data: { email }
			});
			user.emails = emails;
			localSuccess = `Successfully deleted email "${email}".`;
		} catch (err) {
			if (err instanceof Error) {
				localError = err.message;
			}
			localError = 'Unknown error. Please try again. If it persists, contact support.';
		}
	}

	/**
	 * Called automatically after SvelteKit form submission for adding a new email (to be verified).
	 */
	function handleVerifyEmail() {
		return async ({ result }: { result: ActionResult }) => {
			if (result.type === 'success') {
				user.emailVerification = result.data?.email;
				isAddingNewEmail = false;
				localSuccess = `Verification email sent!`;
			} else if (result.type === 'error') {
				localError = `Failed to verify email: ${result.error}`;
			}
		};
	}
</script>

<div class="mb-6">
	<h3 class="text-surface-800-200 mb-4 font-bold">Email addresses</h3>
	<ul class="mb-4 flex flex-col gap-2">
		{#each sortedEmails as email}
			<li class="flex items-center justify-between">
				<div class="text-surface-800-200">
					{email}
					{#if email === user.primaryEmail}
						<span class="text-primary-500 ml-2 text-sm font-semibold">Primary</span>
					{:else}
						<div class="mt-1 flex gap-2">
							<button
								class="btn hover:preset-tonal-surface text-sm"
								onclick={() => handleMakePrimary(email)}
							>
								Make Primary
							</button>
							<button
								class="btn hover:preset-tonal-surface text-sm"
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
	{#if !user.emailVerification}
		{#if !isAddingNewEmail}
			<button class="btn" onclick={addNewEmail}> Add a new email </button>
		{:else}
			<form
				action="/api/user?/verifyEmailAndSendVerification"
				method="POST"
				use:enhance={handleVerifyEmail}
				class="flex gap-2"
			>
				<input type="email" name="email" placeholder="New email" class="input" required />
				<input type="text" name="userId" value={user.id} required hidden />
				<button type="submit" class="btn">Add</button>
				<button type="button" class="btn" onclick={cancelNewEmail}> Cancel </button>
			</form>
		{/if}
	{/if}
	{#if localSuccess}
		<p class="text-success-600-400">{localSuccess}</p>
	{/if}
	{#if localError}
		<p class="text-error-600-400">{localError}</p>
	{/if}
</div>
