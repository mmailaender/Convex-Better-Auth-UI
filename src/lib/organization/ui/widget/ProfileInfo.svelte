<script lang="ts">
	import { Avatar } from '@skeletonlabs/skeleton-svelte';
	import type { User, Organization } from '$lib/db/schema/types/custom';
	import { callForm } from '$lib/primitives/api/callForm';
	import { invalidateAll } from '$app/navigation';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let profileData = $state({
		organizationId: user.activeOrganization!.id,
		name: user.activeOrganization!.name,
		slug: user.activeOrganization!.slug,
		logo: user.activeOrganization!.logo
	});

	let isEditing = $state(false);
	let success = $state('');
	let error = $state('');

	function toggleEdit() {
		isEditing = true;
		success = '';
		error = '';
	}

	function cancelEdit() {
		isEditing = false;
		success = '';
		error = '';
	}

	async function handleSubmit(event: Event) {
		event.preventDefault();
		const form = event.target as HTMLFormElement;
		const formData = new FormData(form);

		try {
			const updatedOrg = await callForm<Organization>({
				url: '/org?/updateOrganizationProfile',
				data: profileData
			});
			user.activeOrganization = updatedOrg;

			isEditing = false;
			success = 'Profile updated successfully!';
			error = '';

			invalidateAll();
		} catch (err: any) {
			error = `Failed to update profile: ${err.message}`;
		}
	}
</script>

<div class="mb-6 flex items-center gap-4">
	<Avatar src={user.activeOrganization!.logo} name={user.activeOrganization!.name} />
	{#if !isEditing}
		<button onclick={toggleEdit}>
			<span class="text-surface-800-200 font-medium">{user.activeOrganization!.name}</span>
		</button>
	{:else}
		<form onsubmit={handleSubmit}>
			<div class="flex flex-col gap-2">
				<label for="name">Name</label>
				<input type="text" name="name" class="input" bind:value={profileData.name} />
				<label for="slug">Slug URL</label>
				<input type="text" name="slug" class="input" bind:value={profileData.slug} />
				<div class="flex gap-2">
					<button type="submit" class="variant-filled btn">Save</button>
					<button type="button" class="variant-ghost btn" onclick={cancelEdit}> Cancel </button>
				</div>
			</div>
		</form>
	{/if}
	{#if success}
		<p class="text-success-600-400">{success}</p>
	{/if}
	{#if error}
		<p class="text-error-600-400">{error}</p>
	{/if}
</div>
