<script lang="ts">
	// Primitives
	import * as Dialog from '#lib/primitives/ui/dialog/index.js';
	import * as Menu from '#lib/primitives/ui/menu/index.js';
	import { Portal } from '@ark-ui/svelte/portal';
	// Icons
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import CopyIcon from '@lucide/svelte/icons/copy';
	import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	import TrashIcon from '@lucide/svelte/icons/trash';
	// API
	import { useConvexClient } from 'convex-svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { toast } from 'svelte-sonner';
	// Types
	import type { AdminOrganization } from '#lib/admin/types.js';

	let {
		organization,
		onView,
		deleteDisabled = false,
		onDeleted
	}: {
		organization: AdminOrganization;
		/** Shows "View organization" when set */
		onView?: () => void;
		/** Disables "Delete organization", such as for one owned by another admin */
		deleteDisabled?: boolean;
		/** Called after the organization is deleted */
		onDeleted?: () => void;
	} = $props();

	const { api } = getAuthContext();
	const client = useConvexClient();

	let deleteOpen = $state(false);
	let deleting = $state(false);

	async function copyId() {
		try {
			await navigator.clipboard.writeText(organization._id);
			toast.success('Copied the organization ID');
		} catch {
			toast.error("Couldn't copy");
		}
	}

	async function handleDelete() {
		const { _id, name } = organization;
		deleting = true;
		try {
			await client.mutation(api.admin.mutations.deleteOrganizationAsAdmin, {
				organizationId: _id
			});
			toast.success(`Deleted ${name}`);
			deleteOpen = false;
			onDeleted?.();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
		} finally {
			deleting = false;
		}
	}
</script>

<Menu.Root>
	<Menu.Trigger class="btn-icon hover:preset-tonal" aria-label={`Actions for ${organization.name}`}>
		<EllipsisVerticalIcon class="size-4" aria-hidden="true" />
	</Menu.Trigger>
	<!-- Portaled so the table's scroll container doesn't clip the menu -->
	<Portal>
		<Menu.Content class="bg-surface-50-950 min-w-52">
			<Menu.Item value="copy-id" onclick={copyId}>
				<CopyIcon aria-hidden="true" />
				Copy organization ID
			</Menu.Item>
			{#if onView}
				<Menu.Item value="view" onclick={onView}>
					<Building2Icon aria-hidden="true" />
					View organization
				</Menu.Item>
			{/if}
			<Menu.Separator />
			<Menu.Item
				value="delete"
				variant="destructive"
				disabled={deleteDisabled}
				onclick={() => (deleteOpen = true)}
			>
				<TrashIcon aria-hidden="true" />
				Delete organization
			</Menu.Item>
		</Menu.Content>
	</Portal>
</Menu.Root>

<!-- Mounted only while open, so a long table doesn't keep a dialog per row -->
<Dialog.Root bind:open={deleteOpen} lazyMount unmountOnExit>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header class="pr-8">
			<Dialog.Title>Delete {organization.name}</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				This permanently deletes the organization with its memberships and pending invitations.
				Members who had it active switch to another of their organizations. This can't be undone.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal" disabled={deleting}>Cancel</Dialog.Close>
			<button
				type="button"
				class="btn preset-filled-error-500"
				onclick={handleDelete}
				disabled={deleting}
				aria-busy={deleting}
			>
				{#if deleting}
					<Loader2Icon class="size-4 animate-spin" aria-hidden="true" />
					Deleting...
				{:else}
					Delete organization
				{/if}
			</button>
		</Dialog.Footer>
		<Dialog.CloseX />
	</Dialog.Content>
</Dialog.Root>
