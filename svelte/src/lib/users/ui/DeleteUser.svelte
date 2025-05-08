<script lang="ts">
	import { useConvexClient } from 'convex-svelte';
	import { useAuth } from '@convex-dev/auth/sveltekit';
	import { api } from '$convex/_generated/api';
	import { Modal } from '@skeletonlabs/skeleton-svelte';

	// State for modal
	let modalOpen: boolean = $state(false);

	const client = useConvexClient();
	const { signOut } = useAuth();

	/**
	 * Handle the delete confirmation action
	 */
	async function handleConfirm(): Promise<void> {
		try {
			await client.action(api.users.invalidateAndDeleteUser, {});
			await signOut();
			modalOpen = false;
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	/**
	 * Handle cancellation of delete confirmation
	 */
	function handleCancel(): void {
		modalOpen = false;
	}
</script>

<Modal
	open={modalOpen}
	onOpenChange={(e) => (modalOpen = e.open)}
	contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm"
	backdropClasses="backdrop-blur-sm"
>
	{#snippet trigger()}
		<button
			class="btn preset-faded-surface-50-950 hover:bg-error-200-800 hover:text-error-950-50 h-10 w-full justify-between gap-1 text-sm"
		>
			Delete account
		</button>
	{/snippet}

	{#snippet content()}
		<header class="flex justify-between">
			<h2 class="h2">Delete your account</h2>
		</header>
		<article>
			<p class="opacity-60">
				Are you sure you want to delete your account? All of your data will be permanently deleted.
			</p>
		</article>
		<footer class="flex justify-end gap-4">
			<button type="button" class="btn preset-tonal" onclick={handleCancel}> Cancel </button>
			<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
				Confirm
			</button>
		</footer>
	{/snippet}
</Modal>
