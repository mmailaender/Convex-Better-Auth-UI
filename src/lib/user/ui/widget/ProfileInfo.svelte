<script lang="ts">
	import { Avatar, FileUpload } from '@skeletonlabs/skeleton-svelte';
	import type { User } from '$lib/db/schema/types/custom';
	import { callForm } from '$lib/primitives/api/callForm';
	import { UploadCloud } from 'lucide-svelte';

	import { type FileChangeDetails } from '@zag-js/file-upload';
	import { optimizeImage } from '$lib/primitives/api/storage/optimizeImage';

	interface Props {
		user: User;
	}

	let { user = $bindable() }: Props = $props();

	let isEditing = $state(false);
	let successMessage = $state('');
	let errorMessage = $state('');
	let isUploading = $state(false);

	function toggleEdit() {
		isEditing = true;
		successMessage = '';
		errorMessage = '';
	}

	function cancelEdit() {
		isEditing = false;
		successMessage = '';
		errorMessage = '';
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
			successMessage = 'Profile updated successfully!';
		} catch (err: any) {
			errorMessage = `Failed to update profile: ${err.message}`;
		}
	}

	async function handleFileChange(details: FileChangeDetails) {
		const file = details.acceptedFiles.at(0);

		if (!file) return;

		try {
			isUploading = true;
			errorMessage = '';
			successMessage = '';

			// Optimize the image before upload
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true // Always convert to WebP
			});

			const formData = new FormData();
			formData.append('avatar', optimizedFile);

			// Call the server action to upload and update profile
			const updatedUser = await callForm<User>({
				url: '/api/user?/updateProfileAvatar',
				data: formData
			});

			// Update local state with the new avatar URL
			user.avatar = updatedUser.avatar;
			successMessage = 'Avatar updated successfully!';
		} catch (err: any) {
			errorMessage = `Failed to upload avatar: ${err.message}`;
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="mb-6 flex items-center gap-4">
	<div class="relative">
		<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
			<div class="group relative cursor-pointer">
				<Avatar src={user.avatar} name={`${user.firstName} ${user.lastName}`} size="size-16" />
				<div
					class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
				>
					<UploadCloud class="size-6 text-white" />
				</div>
				{#if isUploading}
					<div class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
						<div
							class="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
						></div>
					</div>
				{/if}
			</div>
		</FileUpload>
	</div>

	{#if !isEditing}
		<button onclick={toggleEdit} class="flex flex-col">
			<span class="text-surface-800-200 text-lg font-medium">{user.firstName} {user.lastName}</span>
		</button>
	{:else}
		<form onsubmit={handleSubmit} class="w-full">
			<div class="flex flex-col gap-2">
				<div class="flex gap-2">
					<input type="text" name="firstName" class="input" bind:value={user.firstName} />
					<input type="text" name="lastName" class="input" bind:value={user.lastName} />
				</div>
				<div class="flex gap-2">
					<button type="submit" class="btn preset-filled-primary-500">Save</button>
					<button type="button" class="btn preset-tonal" onclick={cancelEdit}>Cancel</button>
				</div>
			</div>
		</form>
	{/if}
</div>

{#if successMessage}
	<p class="text-success-600-400 mt-2">{successMessage}</p>
{/if}
{#if errorMessage}
	<p class="text-error-600-400 mt-2">{errorMessage}</p>
{/if}
