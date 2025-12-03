<script lang="ts">
	// Navigation
	import { goto } from '$app/navigation';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	/** UI **/
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Dialog from '$lib/primitives/ui/dialog';
	// Icons
	import Loader2Icon from '@lucide/svelte/icons/loader-2';

	import type { FunctionReturnType } from 'convex/server';
	import type { authClient } from '$lib/auth/api/auth-client';
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type Role = typeof authClient.$Infer.Member.role;

	/**
	 * Component for deleting an organization
	 * Only available to organization owners
	 */
	const { onSuccessfulDelete, redirectTo, initialData } = $props<{
		/**
		 * Optional callback that will be called when an organization is successfully deleted
		 */
		onSuccessfulDelete?: () => void;
		/**
		 * Optional redirect URL after successful deletion
		 */
		redirectTo?: string;
		initialData?: {
			activeOrganization?: GetActiveOrganizationType;
			role?: Role;
		};
	}>();

	// Auth
	const auth = useAuth();

	// Queries
	const activeOrganizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeOrganization
		})
	);
	const activeOrganization = $derived(
		activeOrganizationResponse?.data ?? initialData?.activeOrganization
	);
	const roles = useRoles({}, () => ({
		initialData: initialData?.role
	}));
	const isOwner = $derived(roles.hasOwnerRole);

	// State
	let dialogOpen: boolean = $state(false);
	let isDeleting: boolean = $state(false);

	/**
	 * Handle confirmation of organization deletion
	 */
	async function handleConfirm(): Promise<void> {
		isDeleting = true;
		try {
			if (!activeOrganization) return;

			await client.mutation(api.organizations.mutations.deleteOrganization, {
				organizationId: activeOrganization.id
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
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if isOwner && activeOrganization}
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
				<div class="text-surface-700-300 space-y-3 text-sm">
					<p>Are you sure you want to delete this organization?</p>
					<div
						class="bg-surface-200-800 border-surface-200-800 rounded-container border p-3 text-center"
					>
						<span class="text-surface-800-200 font-semibold">{activeOrganization.name}</span>
					</div>
					<p>All organization data will be permanently deleted and cannot be recovered.</p>
				</div>
			</article>

			<Dialog.Footer class="w-full">
				<Dialog.Close class="btn preset-tonal" disabled={isDeleting}>Cancel</Dialog.Close>
				<button
					type="button"
					class="btn preset-filled-error-500"
					onclick={handleConfirm}
					disabled={isDeleting}
					aria-busy={isDeleting}
				>
					{#if isDeleting}
						<Loader2Icon class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
						Deleting...
					{:else}
						Delete
					{/if}
				</button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
