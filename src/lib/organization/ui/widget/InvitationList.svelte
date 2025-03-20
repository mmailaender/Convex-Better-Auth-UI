<script lang="ts">
	// Modules
	import { Shield, ShieldCheck } from 'lucide-svelte';

	// Lib
	import { callForm } from '$lib/primitives/api/callForm';

	// Types
	import type { Invitation, User } from '$lib/db/schema/types/custom';
	import type { NullDocument } from '$lib/db/schema/types/system';

	interface Props {
		user: User;
		invitations: Array<Invitation>;
		isOwnerOrAdmin: boolean;
	}
	let { user = $bindable(), invitations, isOwnerOrAdmin }: Props = $props();

	let errorMessage = $state('');
	let successMessage = $state('');

	async function handleRevokeInvitation(invitationId: string) {
		try {
			await callForm<NullDocument>({
				url: '/api/org?/revokeInvitation',
				data: { invitationId }
			});
			errorMessage = '';
			successMessage = 'Invitation revoked successfully!';
			user.activeOrganization!.invitations = user.activeOrganization!.invitations.filter(
				(invitation) => invitation.id !== invitationId
			);
		} catch (err) {
			successMessage = '';
			errorMessage = 'Failed to revoke invitation';
			console.error(err);
		}
	}
</script>

{#if errorMessage}
	<p class="text-error-500">{errorMessage}</p>
{/if}
{#if successMessage}
	<p class="text-success-500">{successMessage}</p>
{/if}
{#if invitations.length == 0}
	<div class="text-surface-600-400 p-8 text-center">
		<p>No pending invitations.</p>
	</div>
{:else}
	<div class="overflow-x-auto">
		<table class="w-full">
			<thead>
				<tr class="border-surface-300-700 border-b">
					<th class="p-2 text-left">Email</th>
					<th class="p-2 text-left">Role</th>
					<th class="p-2 text-left">Invited By</th>
					{#if isOwnerOrAdmin}
						<th class="p-2 text-right">Actions</th>
					{/if}
				</tr>
			</thead>
			<tbody>
				{#each invitations as invitation}
					<tr class="border-surface-300-700 border-b">
						<td class="p-2">{invitation.email}</td>
						<td class="p-2">
							{#if invitation.role === 'role_organization_owner'}
								<div class="flex items-center">
									<ShieldCheck class="text-primary-500 mr-1 size-4" />
									<span class="font-medium">Owner</span>
								</div>
							{:else if invitation.role === 'role_organization_admin'}
								<div class="flex items-center">
									<Shield class="text-primary-400 mr-1 size-4" />
									<span class="font-medium">Admin</span>
								</div>
							{:else}
								<span>Member</span>
							{/if}
						</td>
						<td class="p-2">{invitation.invitedBy.firstName} {invitation.invitedBy.lastName}</td>
						<td class="p-2 text-right">
							<button
								class="btn text-error-500"
								onclick={() => handleRevokeInvitation(invitation.id)}
							>
								Revoke
							</button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
