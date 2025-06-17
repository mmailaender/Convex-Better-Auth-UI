<script lang="ts">
	// Primitives
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { toast } from 'svelte-sonner';

	// API (Convex)
	import { useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { api } from '$convex/_generated/api';
	import { ConvexError } from 'convex/values';

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
			if (error instanceof ConvexError) {
				toast.error(error.data);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Error deleting user');
			}
		}
	}
</script>

<Dialog.Root bind:open={deleteDialogOpen}>
	<Dialog.Trigger
		class="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 rounded-base justify-between gap-1 text-sm"
		>Delete account</Dialog.Trigger
	>
	<Dialog.Content class="md:max-w-108">
		<Dialog.Header>
			<Dialog.Title>Delete your account</Dialog.Title>
			<Dialog.Description class="text-surface-700-300">
				Are you sure you want to delete your account? All of your data will be permanently deleted.
			</Dialog.Description>
		</Dialog.Header>
		<Dialog.Footer>
			<Dialog.Close class="btn preset-tonal">Cancel</Dialog.Close>
			<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
				Confirm
			</button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
