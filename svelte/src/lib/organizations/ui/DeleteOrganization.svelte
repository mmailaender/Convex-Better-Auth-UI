<script lang="ts">
	// Navigation
	import { goto } from '$app/navigation';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	/** UI **/
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/primitives/ui/dialog';

	const roles = createRoles();

	/**
	 * Component for deleting an organization
	 * Only available to organization owners
	 */
	const { onSuccessfulDelete, redirectTo } = $props<{
		/**
		 * Optional callback that will be called when an organization is successfully deleted
		 */
		onSuccessfulDelete?: () => void;
		/**
		 * Optional redirect URL after successful deletion
		 */
		redirectTo?: string;
	}>();

	// Queries
	const activeOrganizationResponse = useQuery(api.organizations.getActiveOrganization, {});
	const activeOrganization = $derived(activeOrganizationResponse.data);

	// State
	let dialogOpen: boolean = $state(false);

	/**
	 * Handle confirmation of organization deletion
	 */
	async function handleConfirm(): Promise<void> {
		try {
			if (!activeOrganization) return;

			await client.mutation(api.organizations.deleteOrganization, {
				organizationId: activeOrganization._id
			});
			dialogOpen = false;

			toast.success('Organization deleted successfully');

			// Call the onSuccessfulDelete callback if provided
			if (onSuccessfulDelete) {
				onSuccessfulDelete();
			}

			// Navigate to the specified URL or home by default
			if (redirectTo) {
				goto(redirectTo);
			} else {
				goto('/');
			}
		} catch (err) {
			if (err instanceof Error) {
				toast.error(err.message);
			} else {
				toast.error('Unknown error. Please try again. If it persists, contact support.');
			}
		}
	}

	/**
	 * Handle cancellation of deletion
	 */
	function handleCancel(): void {
		dialogOpen = false;
	}
</script>

{#if roles.isOwner && activeOrganization}
	<Dialog.Root bind:open={dialogOpen}>
		<Dialog.Trigger
			class="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 w-fit justify-between gap-1 text-sm"
			>Delete organization</Dialog.Trigger
		>

		<Dialog.Content class="w-[90%] max-w-md">
			<Dialog.Header>
				<Dialog.Title>Delete organization</Dialog.Title>
			</Dialog.Header>

			<article>
				<p class="text-surface-700-300 text-sm">
					Are you sure you want to delete the organization {activeOrganization.name}? All
					organization data will be permanently deleted.
				</p>
			</article>

			<Dialog.Footer>
				<Dialog.Close class="btn preset-tonal">Cancel</Dialog.Close>
				<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
					Confirm
				</button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
