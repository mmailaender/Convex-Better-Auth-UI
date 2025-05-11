<script lang="ts">
	// API
	import { api } from '$convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';
	const client = useConvexClient();

	// Components
	import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-svelte';

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import { type FileChangeDetails } from '@zag-js/file-upload';
	import type { FunctionReturnType } from 'convex/server';
	type UserResponse = FunctionReturnType<typeof api.users.getUser>;

	// Props
	let { initialData }: { initialData?: UserResponse } = $props();

	// Query
	const response = useQuery(api.users.getUser, {}, { initialData });

	// State
	let isEditing: boolean = $state(false);
	let successMessage: string = $state('');
	let errorMessage: string = $state('');
	let isUploading: boolean = $state(false);
	let name: string = $state('');

	// Derived state
	const userData = $derived(response.data);

	// Initialize name when user data is available
	$effect(() => {
		if (userData && name === '') {
			name = userData.name;
		}
	});

	// Handle toggling edit mode
	function toggleEdit(): void {
		isEditing = true;
		successMessage = '';
		errorMessage = '';
	}

	// Handle canceling edit
	function cancelEdit(): void {
		isEditing = false;
		successMessage = '';
		errorMessage = '';
	}

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		try {
			await client.mutation(api.users.updateUserName, {
				name
			});

			isEditing = false;
			successMessage = 'Profile updated successfully!';
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			errorMessage = `Failed to update profile: ${errorMsg}`;
		}
	}

	// Handle file upload for avatar
	async function handleFileChange(details: FileChangeDetails): Promise<void> {
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

			// Get a storage upload URL from Convex
			const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});

			// Upload the file to Convex storage
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: {
					'Content-Type': optimizedFile.type
				},
				body: optimizedFile
			});

			if (!response.ok) {
				throw new Error('Failed to upload file');
			}

			// Get the storage ID from the response
			const result = await response.json();
			const storageId = result.storageId as Id<'_storage'>;

			// Update the user's avatar with the storage ID
			await client.mutation(api.users.updateAvatar, {
				storageId
			});

			successMessage = 'Avatar updated successfully!';
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			errorMessage = `Failed to upload avatar: ${errorMsg}`;
		} finally {
			isUploading = false;
		}
	}
</script>

<div>
	{#if !userData}
		<div class="h-16 w-full animate-pulse rounded-md bg-gray-200"></div>
	{:else}
		<div class="flex flex-col items-center gap-1">
			<p class="w-full py-2 pl-4 font-semibold">Profile</p>
			<div class="bg-surface-50-950 flex w-full items-center justify-center rounded-lg p-0 py-4">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div class="group relative flex cursor-pointer flex-col gap-2">
						<Avatar src={userData.image || ''} name={userData.name} size="size-20" />
						<span class="text-surface-950-50 text-center text-sm font-semibold hover:underline">
							Upload
						</span>

						{#if isUploading}
							<ProgressRing
								value={null}
								size="size-14"
								meterStroke="stroke-primary-600-400"
								trackStroke="stroke-primary-50-950"
							/>
						{/if}
					</div>
				</FileUpload>
			</div>

			{#if !isEditing}
				<button
					onclick={toggleEdit}
					class="bg-surface-50-950 flex w-full flex-col items-start rounded-lg px-4 py-2"
				>
					<span class="text-surface-600-400 text-xs">Name</span>
					<span class="text-surface-800-200 font-medium">
						{userData.name}
					</span>
				</button>
			{:else}
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col gap-2">
						<div class="flex gap-2">
							<input type="text" class="input" bind:value={name} />
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
	{/if}
</div>
