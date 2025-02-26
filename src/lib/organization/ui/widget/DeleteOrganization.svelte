<script lang="ts">
	import { Modal } from '@skeletonlabs/skeleton-svelte';
	import { callForm } from '$lib/primitives/api/callForm';
	import type { Organization } from '$lib/db/schema/types/custom';
	import { goto } from '$app/navigation';

	interface Props {
		org: Organization;
	}

	let { org = $bindable() }: Props = $props();
	let open = $state(false);
	let error = $state('');

	async function handleConfirm() {
		try {
			await callForm({
				url: '/org?/deleteOrganization',
				data: { organizationId: org.id }
			});
			open = false;
			goto('/', { invalidateAll: true });
		} catch (err) {
			if (err instanceof Error) {
				error = err.message;
			} else {
				error = 'Unknown error. Please try again. If it persists, contact support.';
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
		Delete organization
	{/snippet}
	{#snippet content()}
		<header class="flex justify-between">
			<h2 class="h2">Delete organization</h2>
		</header>
		<article>
			<p class="opacity-60">
				Are you sure you want to delete the organization {org.name}? All organization data will be
				permanently deleted.
			</p>
		</article>
		<footer class="flex justify-end gap-4">
			<button type="button" class="btn preset-tonal" onclick={handleCancel}> Cancel </button>
			<button type="button" class="btn preset-filled-error-500" onclick={handleConfirm}>
				Confirm
			</button>
		</footer>
		{#if error}
			<p class="text-error-600-400">{error}</p>
		{/if}
	{/snippet}
</Modal>
