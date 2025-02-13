<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import type { User } from '$lib/db/schema/types/custom';
	import { callForm } from '$lib/primitives/api/callForm';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let isEditing = $state(false);
	let localSuccess = $state('');
	let localError = $state('');

	function toggleEdit() {
		isEditing = true;
		localSuccess = '';
		localError = '';
	}

	function cancelEdit() {
		isEditing = false;
		localSuccess = '';
		localError = '';
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			await callForm({
				url: '/user-profile?/updateProfileData',
				data: new URLSearchParams(formData as any)
			});
			isEditing = false;
			localSuccess = 'Profile updated successfully!';
		} catch (err: any) {
			localError = `Failed to update profile: ${err.message}`
		}
	}
</script>

<div class="mb-6 flex items-center gap-4">
	<Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="size-16" />
	{#if !isEditing}
		<button onclick={toggleEdit}>
			<span class="font-medium text-surface-800-200">{user.firstName}</span>
			<span class="font-medium text-surface-800-200">{user.lastName}</span>
		</button>
	{:else}
		<form onsubmit={handleSubmit}>
			<div class="flex flex-col gap-2">
				<div class="flex gap-2">
					<input type="text" name="firstName" class="input" bind:value={user.firstName} />
					<input type="text" name="lastName" class="input" bind:value={user.lastName} />
				</div>
				<div class="flex gap-2">
					<button type="submit" class="variant-filled btn">Save</button>
					<button type="button" class="variant-ghost btn" onclick={cancelEdit}> Cancel </button>
				</div>
				{#if localSuccess}
					<p class="text-success-600-400">{localSuccess}</p>
				{/if}
				{#if localError}
					<p class="text-error-600-400">{localError}</p>
				{/if}
			</div>
		</form>
	{/if}
</div>
