<script lang="ts">
	// Components
	import { UserPlus } from 'lucide-svelte';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	const client = useConvexClient();

	// Types
	import type { FunctionReturnType } from 'convex/server';
	import type { Doc } from '$convex/_generated/dataModel';
	type Role = Doc<'organizationMembers'>['role'];
	type InvitationResponse =
		FunctionReturnType<typeof api.organizations.invitations.actions.inviteMembers> extends Array<
			infer T
		>
			? T
			: never;

	// State
	let emailInput: string = $state('');
	let selectedRole: Role = $state('role_organization_member');
	let isProcessing: boolean = $state(false);
	let errorMessage: string = $state('');
	let successMessage: string = $state('');

	/**
	 * Handles the submission of the invitation form
	 */
	async function handleInvite(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (isProcessing) return;
		isProcessing = true;
		errorMessage = '';
		successMessage = '';

		try {
			// Split and clean email addresses
			const emails = emailInput
				.replace(/[,;\s]+/g, ',') // Replace all delimiters (commas, semicolons, spaces) with a single comma
				.split(',')
				.map((email: string) => email.trim())
				.filter((email: string) => email.length > 0);

			if (emails.length === 0) {
				errorMessage = 'Please enter at least one email address';
				isProcessing = false;
				return;
			}

			// Send invitations for all emails at once using Convex action
			const results = await client.action(api.organizations.invitations.actions.inviteMembers, {
				emails,
				role: selectedRole
			});

			// Process results
			const successful = results.filter((r: InvitationResponse) => r.success);
			const failed = results.filter((r: InvitationResponse) => !r.success);

			if (successful.length > 0) {
				successMessage = `Successfully sent ${successful.length} invitation(s) to: ${successful
					.map((r: InvitationResponse) => r.email)
					.join(', ')}`;
				emailInput = '';
			}

			if (failed.length > 0) {
				errorMessage = `Failed to send invitation(s) to: ${failed
					.map((r: InvitationResponse) => r.email)
					.join(', ')}`;
			}
		} catch (err) {
			console.error('An error occurred while processing invitations: ', err);
			errorMessage =
				err instanceof Error ? err.message : 'An error occurred while processing invitations';
		} finally {
			isProcessing = false;
		}
	}

	/**
	 * Handle email input change
	 */
	function handleEmailChange(e: Event): void {
		const target = e.target as HTMLTextAreaElement;
		emailInput = target.value;
	}

	/**
	 * Handle role selection change
	 */
	function handleRoleChange(e: Event): void {
		const target = e.target as HTMLSelectElement;
		selectedRole = target.value as Role;
	}
</script>

<div class="border-surface-300-700 mb-8 rounded-lg border p-4">
	<h3 class="mb-4 flex items-center text-xl font-semibold">
		<UserPlus class="mr-2 size-5" />
		Invite new members
	</h3>

	<form onsubmit={handleInvite} class="flex flex-col gap-4">
		<div class="flex flex-col gap-4 md:flex-row">
			<textarea
				value={emailInput}
				onchange={handleEmailChange}
				placeholder="example@email.com, example2@email.com"
				class="textarea min-h-24 grow"
				required
			></textarea>

			<div class="flex flex-col gap-3">
				<select value={selectedRole} onchange={handleRoleChange} class="select w-full md:w-48">
					<option value="role_organization_member">Member</option>
					<option value="role_organization_admin">Admin</option>
				</select>

				<button type="submit" class="btn variant-filled-primary w-full" disabled={isProcessing}>
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
		<p>
			You can invite multiple people by separating email addresses with commas, semicolons, or
			spaces.
		</p>
	</div>
</div>
