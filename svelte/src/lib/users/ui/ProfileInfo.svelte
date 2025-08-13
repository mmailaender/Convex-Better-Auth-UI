<script lang="ts">
	// API
	import { api } from '$convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { authClient } from '$lib/auth/api/auth-client';
	const client = useConvexClient();

	// Icons
	import { Pencil } from '@lucide/svelte';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';
	import { tick } from 'svelte';

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import { type FileChangeDetails } from '@zag-js/file-upload';
	import type { FunctionReturnType } from 'convex/server';
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	// Props
	let { initialData }: { initialData?: UserResponse } = $props();

	// Query
	const activeUserResponse = useQuery(api.users.queries.getActiveUser, {}, { initialData });
	// Derived state
	const activeUser = $derived(activeUserResponse.data);

	// State
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let loadingStatus = $state('loading');
	let isUploading: boolean = $state(false);

	let nameInputEl: HTMLInputElement | null = $state(null);

	let avatarKey: number = $state(0); // Force re-render when image changes

	// Initialize state when user data is available
	$effect(() => {
		if (activeUser && !isEditingName) {
			name = activeUser.name;
		}
	});

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		try {
			await authClient.updateUser({ name });
			isEditingName = false;
			toast.success('Profile name updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update profile: ${errorMsg}`);
		}
	}

	// Handle file upload for avatar
	async function handleFileChange(details: FileChangeDetails): Promise<void> {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			// Show spinner immediately while uploading
			isUploading = true;

			// Optimize the image before upload
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			// Get a storage upload URL from Convex
			const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});

			// Upload the file to Convex storage
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimizedFile.type },
				body: optimizedFile
			});

			if (!response.ok) {
				throw new Error('Failed to upload file');
			}

			// Get the storage ID from the response
			const result = await response.json();
			const storageId = result.storageId as Id<'_storage'>;

			// Update the user's avatar with the storage ID and get the image URL
			const imageUrl = await client.mutation(api.users.mutations.updateAvatar, { storageId });

			await authClient.updateUser({ image: imageUrl });

			// Reset loading status and force avatar to re-render with new image - this will trigger new loading
			loadingStatus = 'loading';
			avatarKey += 1;

			toast.success('Avatar updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${errorMsg}`);
			// Reset loading status on error
			loadingStatus = 'error';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !activeUser}
		<div class="bg-success-200-800 rounded-base h-16 w-full animate-pulse"></div>
	{:else}
		<!-- Avatar + Upload -->
		<div class="rounded-base flex items-center justify-start pt-6 pl-0.5">
			<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
				<div
					class="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75"
				>
					{#key avatarKey}
						<Avatar.Root class="size-20" onStatusChange={(e) => (loadingStatus = e.status)}>
							<Avatar.Image src={activeUser.image} alt={activeUser.name} />
							<Avatar.Fallback>
								<Avatar.Marble name={activeUser.name} />
							</Avatar.Fallback>
						</Avatar.Root>
					{/key}

					{#if isUploading || loadingStatus === 'loading'}
						<div
							class="bg-surface-50-950 pointer-events-none absolute inset-0 flex items-center justify-center rounded-full"
						>
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"
							></div>
						</div>
					{/if}

					<div
						class="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2"
					>
						<Pencil class="size-4" />
					</div>
				</div>
			</FileUpload>
		</div>

		<!-- Inline editable name -->
		<div
			class={[
				'border-surface-300-700 rounded-container relative w-full border py-2 pr-3 pl-4 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': !isEditingName,
					'hover:bg-surface-50-950': !isEditingName,
					'hover:border-surface-50-950': !isEditingName
				}
			]}
		>
			<div class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
				<div class="flex w-full flex-col gap-0">
					<span class="text-surface-600-400 text-xs">Name</span>
					<!-- View mode (collapses when editing) -->
					<div
						class={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditingName ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
							{ 'mt-1': !isEditingName }
						]}
						aria-hidden={isEditingName}
						inert={isEditingName}
					>
						<div class="overflow-hidden">
							<span class="text-surface-800-200 truncate font-medium">{activeUser.name}</span>
						</div>
					</div>

					<!-- Edit mode (expands when editing) -->
					<div
						class={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditingName ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
							{ 'mt-1': isEditingName }
						]}
						aria-hidden={!isEditingName}
						inert={!isEditingName}
					>
						<div class="overflow-hidden">
							<form onsubmit={handleSubmit} class="flex w-full flex-col gap-3">
								<input bind:this={nameInputEl} type="text" class="input w-full" bind:value={name} />
								<div class="flex gap-2">
									<button
										type="button"
										class="btn preset-tonal w-full md:w-fit"
										onclick={() => {
											name = activeUser.name;
											isEditingName = false;
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn preset-filled-primary-500 w-full md:w-fit"
										disabled={!name || name.trim() === '' || name.trim() === activeUser.name.trim()}
									>
										Save
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
				<!-- Edit affordance and full-area overlay button in view mode -->
				{#if !isEditingName}
					<div class="shrink-0">
						<span class="btn preset-filled-surface-200-800 pointer-events-none p-2">
							<Pencil class="size-4" />
						</span>
					</div>
					<button
						class="absolute inset-0 h-full w-full"
						aria-label="Edit name"
						type="button"
						onclick={async () => {
							isEditingName = true;
							name = activeUser.name;
							await tick();
							nameInputEl?.focus();
							nameInputEl?.select();
						}}
					></button>
				{/if}
			</div>
		</div>
	{/if}
</div>
