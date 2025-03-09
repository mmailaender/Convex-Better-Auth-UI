<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { callForm } from '$lib/primitives/api/callForm';

	interface Props {
		userId: string;
	}

	let { userId }: Props = $props();
	let open = $state(false);
	let localError = $state('');

	async function handleConfirm() {
		try {
			await callForm({
				url: '/api/user?/deleteUser',
				data: { userId }
			});
		} catch (err) {
			if (err instanceof Error) {
				localError = err.message;
			} else {
				localError = 'Unknown error. Please try again. If it persists, contact support.';
			}
		}
	}

	function handleCancel() {
		open = false;
	}
</script>

<Modal
	bind:open
	triggerBase="btn text-error-500 hover:preset-tonal-error-500"
	contentBase="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm)"
	backdropClasses="backdrop-blur-xs"
>
	{#snippet trigger()}
		Delete account
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
		{#if localError}
			<p class="text-error-600-400">{localError}</p>
		{/if}
	{/snippet}
</Modal>
