<script lang="ts">
	import type { Invitation, User } from '$lib/db/schema/types/custom';
	import { callForm } from '$lib/primitives/api/callForm';
	import { UserPlus } from 'lucide-svelte';

	type Props = {
		user: User;
	};

	let { user = $bindable() }: Props = $props();

	let emailInput = $state('');
	let selectedRole = $state('role_organization_member');
	let isProcessing = $state(false);

	let errorMessage = $state('');
	let successMessage = $state('');

	/**
	 * Handles the submission of the invitation form
	 */
	async function handleInvite(event: SubmitEvent) {
		event.preventDefault();

		if (isProcessing) return;
		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			// Split and clean email addresses
			const emails = emailInput
				.split(',')
				.map((email) => email.trim())
				.filter((email) => email.length > 0);

			if (emails.length === 0) {
				errorMessage = 'Please enter at least one email address';
				isProcessing = false;
				return;
			}

			// Send invitations for each email
			const invitationPromises = emails.map(async (email) => {
				try {
					const invitation = await callForm<Invitation>({
						url: `/api/org?/inviteUserToOrganization`,
						data: {
							email,
							role: selectedRole,
							invitedBy: `${user.firstName} ${user.lastName}`
						}
					});
					return { email, invitation, success: true };
				} catch (err) {
					return {
						email,
						success: false,
						error: err instanceof Error ? err.message : 'Unknown error'
					};
				}
			});

			const results = await Promise.all(invitationPromises);

			// Process results
			const successful = results.filter((r) => r.success);
			const failed = results.filter((r) => !r.success);

			if (successful.length > 0) {
				successMessage = `Successfully sent ${successful.length} invitation(s) to: ${successful
					.map((r) => r.email)
					.join(', ')}`;
				emailInput = '';

				user.activeOrganization!.invitations = [
					...user.activeOrganization!.invitations,
					...successful.map((r) => r.invitation!)
				];
			}

			if (failed.length > 0) {
				errorMessage = `Failed to send invitation(s) to: ${failed.map((r) => r.email).join(', ')}`;
			}
		} catch (err) {
			console.error('An error occurred while processing invitations: ', err);
			errorMessage =
				err instanceof Error ? err.message : 'An error occurred while processing invitations';
		} finally {
			isProcessing = false;
		}
	}
</script>

<div class="border-surface-300-700 mb-8 rounded-lg border p-4">
	<h3 class="h4 mb-4 flex items-center">
		<UserPlus class="mr-2 size-5" />
		Invite new members
	</h3>

	<form onsubmit={handleInvite} class="flex flex-col gap-4">
		<div class="flex flex-col gap-4 md:flex-row">
			<textarea
				bind:value={emailInput}
				placeholder="example@email.com, example2@email.com"
				class="textarea min-h-24 grow"
				required
			></textarea>

			<div class="flex flex-col gap-3">
				<select bind:value={selectedRole} class="select w-full md:w-48">
					<option value="role_organization_member">Member</option>
					<option value="role_organization_admin">Admin</option>
				</select>

				<button type="submit" class="btn preset-filled-primary-500 w-full" disabled={isProcessing}>
					{isProcessing ? 'Sending...' : 'Send Invitations'}
				</button>
			</div>
		</div>
	</form>

	{#if successMessage}
		<div
			class="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 mt-3 rounded-lg p-3"
		>
			{successMessage}
		</div>
	{/if}

	{#if errorMessage}
		<div
			class="bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200 mt-3 rounded-lg p-3"
		>
			{errorMessage}
		</div>
	{/if}

	<div class="text-surface-500-500 mt-3 text-xs">
		<p>You can invite multiple people by separating email addresses with commas.</p>
	</div>
</div>
