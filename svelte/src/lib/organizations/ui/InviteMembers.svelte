<script lang="ts">
	// Icons
	import { UserPlus } from '@lucide/svelte';

	// Primitives
	import { toast } from 'svelte-sonner';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	const client = useConvexClient();

	// API Types
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

	/**
	 * Handles the submission of the invitation form
	 */
	async function handleInvite(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (isProcessing) return;
		isProcessing = true;

		try {
			// Split and clean email addresses
			const emails = emailInput
				.replace(/[,;\s]+/g, ',') // Replace all delimiters (commas, semicolons, spaces) with a single comma
				.split(',')
				.map((email: string) => email.trim())
				.filter((email: string) => email.length > 0);

			if (emails.length === 0) {
				toast.error('Please enter at least one email address');
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
				const msg = `Sent ${successful.length} invitation(s) to: ${successful
					.map((r: InvitationResponse) => r.email)
					.join(', ')}`;
				toast.success(msg);
				emailInput = '';
			}

			if (failed.length > 0) {
				const msg = `Failed to send invitation(s) to: ${failed
					.map((r: InvitationResponse) => r.email)
					.join(', ')}`;
				toast.error(msg);
			}
		} catch (err) {
			console.error('An error occurred while processing invitations: ', err);
			const errorMsg =
				err instanceof Error ? err.message : 'An error occurred while processing invitations';
			toast.error(errorMsg);
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

<form onsubmit={handleInvite} class="flex flex-col gap-4">
	<div class="flex flex-col gap-4">
		<div class="flex flex-col">
			<label>
				<span class="label">Role</span>
				<select value={selectedRole} onchange={handleRoleChange} class="select w-full">
					<option value="role_organization_member">Member</option>
					<option value="role_organization_admin">Admin</option>
				</select>
			</label>
		</div>
		<div class="flex flex-col gap-2">
			<label>
				<span class="label">Email(s)</span>
				<textarea
					value={emailInput}
					onchange={handleEmailChange}
					placeholder="example@email.com, example2@email.com"
					class="textarea min-h-24 grow"
					required
				></textarea>
			</label>
			<p class="text-surface-600-400 px-1 text-xs">
				You can invite multiple people by separating email addresses with commas, semicolons, or
				spaces.
			</p>
		</div>
		<div class="flex justify-end gap-2 pt-6 md:flex-row">
			<button type="submit" class="btn preset-filled-primary-500" disabled={isProcessing}>
				{isProcessing ? 'Sending...' : 'Send Invitations'}
			</button>
		</div>
	</div>
</form>
