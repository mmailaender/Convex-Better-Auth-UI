<script lang="ts">
	// API (Convex)
	import { useConvexClient } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	import { api } from '$convex/_generated/api';

	// Components
	import {
		Dialog,
		DialogTrigger,
		DialogTitle,
		DialogHeader,
		DialogDescription,
		DialogContent,
		DialogFooter
	} from '$lib/primitives/ui/dialog';

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

<Dialog bind:open={deleteDialogOpen}>
	<DialogTrigger
		class="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 justify-between gap-1 rounded-lg text-sm"
		>Delete account</DialogTrigger
	>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Delete your account</DialogTitle>
			<DialogDescription class="text-surface-700-300">
				Are you sure you want to delete your account? All of your data will be permanently deleted.
			</DialogDescription>
		</DialogHeader>
		<DialogFooter>
			<button type="button" class="btn preset-tonal" onclick={handleCancel}> Cancel </button>
			<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
				Confirm
			</button>
		</DialogFooter>
	</DialogContent>
</Dialog>
