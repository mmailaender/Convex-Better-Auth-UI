<script lang="ts">
	// API
	import { api } from '$convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';
	const client = useConvexClient();

	// Icons
	import { Pencil } from '@lucide/svelte';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Drawer from '$lib/primitives/ui/drawer';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import { type FileChangeDetails } from '@zag-js/file-upload';
	import type { FunctionReturnType } from 'convex/server';
	type UserResponse = FunctionReturnType<typeof api.users.queries.getUser>;

	// Props
	let { initialData }: { initialData?: UserResponse } = $props();

	// Query
	const response = useQuery(api.users.queries.getUser, {}, { initialData });

	// State
	let isDialogOpen: boolean = $state(false);
	let isDrawerOpen: boolean = $state(false);
	let name: string = $state('');
	let loadingStatus: 'loading' | 'loaded' | 'error' = $state('loaded');

	let avatarKey: number = $state(0); // Force re-render when image changes

	// Derived state
	const user = $derived(response.data);

	// Initialize state when user data is available
	$effect(() => {
		if (user && name === '') {
			name = user.name;
		}
	});

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		try {
			await client.mutation(api.users.mutations.updateUserName, { name });
			isDialogOpen = false;
			isDrawerOpen = false;
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
			// Set loading status to show spinner immediately
			loadingStatus = 'loading';

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

			// Update the user's avatar with the storage ID
			await client.mutation(api.users.mutations.updateAvatar, { storageId });

			// Force avatar to re-render with new image - this will trigger new loading
			avatarKey += 1;

			toast.success('Avatar updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${errorMsg}`);
			// Reset loading status on error
			loadingStatus = 'error';
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !user}
		<div class="bg-success-200-800 rounded-base h-16 w-full animate-pulse"></div>
	{:else}
		<!-- Avatar + Upload -->
		<div class="rounded-base flex items-center justify-start pt-6 pl-0.5">
			<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
				<div
					class="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75"
				>
					{#key avatarKey}
						<Avatar.Root class="size-20" bind:loadingStatus>
							<Avatar.Image src={user.image} alt={user.name} />
							<Avatar.Fallback>
								{#if loadingStatus === 'loading'}
									<div
										class="absolute inset-0 flex items-center justify-center rounded-full bg-black/50"
									>
										<div
											class="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"
										></div>
									</div>
								{:else}
									<Avatar.Marble name={user.name} />
								{/if}
							</Avatar.Fallback>
						</Avatar.Root>
					{/key}

					<div
						class="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2"
					>
						<Pencil class="size-4" />
					</div>
				</div>
			</FileUpload>
		</div>

		<!-- Desktop Dialog - hidden on mobile, shown on desktop -->
		<Dialog.Root bind:open={isDialogOpen}>
			<Dialog.Trigger
				class="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 rounded-container hidden w-full flex-row content-center items-center border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
				onclick={() => (isDialogOpen = true)}
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Name</span>
					<span class="text-surface-800-200 font-medium">{user.name}</span>
				</div>
				<div class="btn preset-filled-surface-200-800 p-2">
					<Pencil class="size-4" />
				</div>
			</Dialog.Trigger>

			<Dialog.Content class="w-full max-w-md">
				<Dialog.Header>
					<Dialog.Title>Edit name</Dialog.Title>
				</Dialog.Header>
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col">
						<label class="flex flex-col">
							<span class="label">Name</span>
							<input type="text" class="input w-full" bind:value={name} />
						</label>
						<Dialog.Footer>
							<Dialog.Close class="btn preset-tonal w-full md:w-fit">Cancel</Dialog.Close>
							<button type="submit" class="btn preset-filled-primary-500 w-full md:w-fit">
								Save
							</button>
						</Dialog.Footer>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Mobile Drawer - shown on mobile, hidden on desktop -->
		<Drawer.Root bind:open={isDrawerOpen}>
			<Drawer.Trigger
				onclick={() => (isDrawerOpen = true)}
				class="border-surface-300-700 rounded-base flex w-full flex-row content-center items-center border py-2 pr-3 pl-4 md:hidden"
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Name</span>
					<span class="text-surface-800-200 font-medium">{user.name}</span>
				</div>
				<div class="btn-icon preset-faded-surface-50-950">
					<Pencil class="size-4" />
				</div>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>Edit name</Drawer.Title>
				</Drawer.Header>
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col">
						<label class="flex flex-col">
							<span class="label">Name</span>
							<input type="text" class="input w-full" bind:value={name} />
						</label>
						<Dialog.Footer>
							<Dialog.Close class="btn preset-tonal w-full md:w-fit">Cancel</Dialog.Close>
							<button type="submit" class="btn preset-filled-primary-500 w-full md:w-fit">
								Save
							</button>
						</Dialog.Footer>
					</div>
				</form>
				<Drawer.CloseX />
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</div>
