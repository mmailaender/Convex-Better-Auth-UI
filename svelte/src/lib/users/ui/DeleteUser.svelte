<script lang="ts">
	// API (Convex)
	import { useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { api } from '$convex/_generated/api';

	// Components
	import * as Dialog from '$lib/primitives/ui/dialog';

	// State
	let deleteDialogOpen: boolean = $state(false);

	const client = useConvexClient();
	const { signOut } = useAuth();

	/**
	 * Handle the delete confirmation action
	 */
	async function handleConfirm(): Promise<void> {
		try {
			await client.action(api.users.invalidateAndDeleteUser, {});
			await signOut();
			deleteDialogOpen = false;
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	/**
	 * Handle cancellation of delete confirmation
	 */
	function handleCancel(): void {
		deleteDialogOpen = false;
	}
</script>

<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Trigger
		class="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 justify-between gap-1 rounded-lg text-sm"
		>Delete account</Dialog.Trigger
	>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Delete your account</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				Are you sure you want to delete your account? All of your data will be permanently deleted.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<button type="button" class="btn preset-tonal" onclick={handleCancel}> Cancel </button>
			<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
				Confirm
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
