<script lang="ts">
	import type { User } from '$lib/db/schema/types/custom';
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { callForm } from '$lib/primitives/api/callForm';
	import { goto } from '$app/navigation';

	interface Props {
		user: User;
	}
	let { user = $bindable() }: Props = $props();
	let open = $state(false);
	let localError = $state('');
	let selectedSuccessor = $state<string | null>(null);

	// Check if user is an organization owner
	const isOrgOwner = $derived(user.roles?.includes('role_organization_owner') ?? false);

	// Get members excluding current user for successor selection
	const organizationMembers = $derived(
		user.activeOrganization?.members?.filter((member) => member.user.id !== user.id) ?? []
	);

	$inspect('LeaveOrganization organizationMembers: ', organizationMembers);

	function validateForm(): boolean {
		if (isOrgOwner && !selectedSuccessor) {
			localError = 'You must select a successor before leaving the organization.';
			return false;
		}
		return true;
	}

	async function handleLeaveOrganization() {
		if (!validateForm()) return;

		try {
			await callForm({
				url: '/api/org?/leaveOrganization',
				data: {
					successorId: selectedSuccessor
				}
			});
			open = false;

			goto('/', { invalidateAll: true });
		} catch (err) {
			if (err instanceof Error) {
				localError = err.message;
			} else {
				localError = 'Failed to leave organization. Please try again.';
			}
		}
	}
</script>

{#if user.activeOrganization && user.activeOrganization.members.length > 1}
	<Modal
		bind:open
		triggerBase="btn text-error-500 hover:preset-tonal-error-500"
		contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm)"
		backdropClasses="backdrop-blur-xs"
	>
		{#snippet trigger()}
			Leave organization
		{/snippet}
		{#snippet content()}
			<header class="flex justify-between">
				<h2 class="h2">Leave organization</h2>
			</header>
			<article class="space-y-4">
				<p class="opacity-60">
					Are you sure you want to leave your organization? You will lose access to all projects and
					resources.
				</p>

				{#if isOrgOwner}
					<div class="bg-warning-100 border-warning-300 rounded-md border p-3">
						<p class="text-warning-800 text-sm font-medium">
							As the organization owner, you must designate a successor before leaving.
						</p>
					</div>

					<div class="space-y-2">
						<label for="successor" class="text-surface-800-200 font-medium"
							>Select a successor:</label
						>
						<select
							id="successor"
							bind:value={selectedSuccessor}
							class="select"
							required={isOrgOwner}
						>
							<option value="" disabled selected>Choose a successor</option>
							{#each organizationMembers as member}
								<option value={member.user.id}>
									{member.user.firstName}
									{member.user.lastName} ({member.user.primaryEmail})
								</option>
							{/each}
						</select>
					</div>
				{/if}
			</article>
			<footer class="flex justify-end gap-4">
				<button type="button" class="btn preset-tonal" onclick={() => (open = false)}>
					Cancel
				</button>
				<button
					type="button"
					class="btn preset-filled-error-500"
					onclick={handleLeaveOrganization}
					disabled={isOrgOwner && !selectedSuccessor}
				>
					Confirm
				</button>
			</footer>
			{#if localError}
				<p class="text-error-600-400">{localError}</p>
			{/if}
		{/snippet}
	</Modal>
{/if}
