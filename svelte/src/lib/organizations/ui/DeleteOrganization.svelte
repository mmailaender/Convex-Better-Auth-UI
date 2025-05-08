<script lang="ts">
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { goto } from '$app/navigation';
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { isOwner } from '$lib/organizations/api/roles.svelte';
	import { X } from 'lucide-svelte';

	const { onSuccessfulDelete, redirectTo } = $props<{
		onSuccessfulDelete?: () => void;
		redirectTo?: string;
	}>();

	// Client for Convex API calls
	const client = useConvexClient();

	// State
	let modalOpen: boolean = $state(false);
	let error: string = $state('');

	// Get active organization from Convex
	const organizationResponse = useQuery(api.organizations.getActiveOrganization, {});
	const activeOrganization = $derived(organizationResponse.data);

	/**
	 * Handle confirmation of organization deletion
	 */
	async function handleConfirm(): Promise<void> {
		try {
			if (!activeOrganization) return;

			await client.mutation(api.organizations.deleteOrganization, {
				organizationId: activeOrganization._id
			});

			modalOpen = false;

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
				error = err.message;
			} else {
				error = 'Unknown error. Please try again. If it persists, contact support.';
			}
		}
	}

	/**
	 * Handle cancellation of deletion
	 */
	function handleCancel(): void {
		modalOpen = false;
	}
</script>

{#if isOwner && activeOrganization}
	<Modal
		open={modalOpen}
		onOpenChange={(e) => (modalOpen = e.open)}
		triggerBase="btn text-error-500 hover:preset-tonal-error-500"
		contentBase="card p-4 space-y-4 shadow-xl max-w-screen-sm"
	>
		<!-- Delete organization trigger button -->
		{#snippet trigger()}
			Delete organization
		{/snippet}

		<!-- Modal content -->
		{#snippet content()}
			<header class="flex justify-between">
				<h2 class="h2">Delete organization</h2>
				<button
					class="btn-icon preset-tonal size-8 rounded-full"
					onclick={() => (modalOpen = false)}
					aria-label="Close"
				>
					<X class="size-4" />
				</button>
			</header>

			<article>
				<p class="opacity-60">
					Are you sure you want to delete the organization {activeOrganization.name}? All
					organization data will be permanently deleted.
				</p>
			</article>

			<footer class="mt-4 flex justify-end gap-4">
				<button type="button" class="btn preset-tonal" onclick={handleCancel}> Cancel </button>
				<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
					Confirm
				</button>
			</footer>

			{#if error}
				<p class="text-error-600-400 mt-2">{error}</p>
			{/if}
		{/snippet}
	</Modal>
{/if}
