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
	import { Avatar, FileUpload } from '@skeletonlabs/skeleton-svelte';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';
	import { preloadImage } from '$lib/primitives/utils/preloadImage';

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
	let isDialogOpen: boolean = $state(false);
	let isDrawerOpen: boolean = $state(false);
	let name: string = $state('');
	let avatarSrc: string = $state('');
	let isUploading: boolean = $state(false);

	// Derived state
	const userData = $derived(response.data);

	// Initialize state when user data is available
	$effect(() => {
		if (userData) {
			if (name === '') {
				name = userData.name;
			}
			if (avatarSrc === '' && userData.image) {
				avatarSrc = userData.image;
			}
		}
	});

	// Preload new server image when it changes
	$effect(() => {
		if (!userData?.image || userData.image === avatarSrc) return;

		let revoked: string | undefined;

		preloadImage(userData.image)
			.then(() => {
				if (avatarSrc.startsWith('blob:')) {
					revoked = avatarSrc;
				}
				avatarSrc = userData.image!;
			})
			.catch(() => void 0);

		return () => {
			if (revoked) URL.revokeObjectURL(revoked);
		};
	});

	// Handle canceling edit
	function cancelEdit(): void {
		isDialogOpen = false;
		isDrawerOpen = false;
		setTimeout(() => {
			if (userData) name = userData.name;
		}, 125);
	}

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		try {
			await client.mutation(api.users.updateUserName, { name });
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

			const blobUrl = URL.createObjectURL(optimizedFile);

			// Cleanup previous blob
			if (avatarSrc.startsWith('blob:')) {
				URL.revokeObjectURL(avatarSrc);
			}

			// Optimistic UI update
			avatarSrc = blobUrl;

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
			await client.mutation(api.users.updateAvatar, { storageId });

			toast.success('Avatar updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${errorMsg}`);

			// Revert to server image
			avatarSrc = userData?.image || '';
		} finally {
			isUploading = false;
		}
	}
</script>

<div class="flex flex-col gap-6">
	{#if !userData}
		<div class="bg-success-200-800 h-16 w-full animate-pulse rounded-md"></div>
	{:else}
		<!-- Avatar + Upload -->
		<div class="flex items-center justify-start rounded-lg pt-6 pl-0.5">
			<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
				<div class="group relative flex cursor-pointer flex-col gap-2">
					<!-- Key swap + fade for cross-fade effect -->
					<div class="animate-fade-in-out">
						<Avatar src={avatarSrc || userData.image || ''} name={userData.name} size="size-20" />
					</div>

					<div
						class="btn-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2"
					>
						<Pencil size={16} color="currentColor" />
					</div>
				</div>
			</FileUpload>
		</div>

		<!-- Desktop Dialog - hidden on mobile, shown on desktop -->
		<Dialog.Root bind:open={isDialogOpen}>
			<Dialog.Trigger
				class="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 hidden w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
				onclick={() => (isDialogOpen = true)}
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Name</span>
					<span class="text-surface-800-200 font-medium">{userData.name}</span>
				</div>
				<div class="btn preset-filled-surface-200-800 p-2">
					<Pencil size={16} color="currentColor" />
				</div>
			</Dialog.Trigger>

			<Dialog.Content class="w-full max-w-md">
				<Dialog.Header>
					<Dialog.Title>Edit name</Dialog.Title>
				</Dialog.Header>
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col">
						<div class="flex flex-col">
							<label class="label" for="name-input">Name</label>
							<input id="name-input" type="text" class="input w-full" bind:value={name} />
						</div>
						<Dialog.Footer>
							<button type="button" class="btn preset-tonal w-full md:w-fit" onclick={cancelEdit}>
								Cancel
							</button>
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
				class="border-surface-300-700 flex w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 md:hidden"
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Name</span>
					<span class="text-surface-800-200 font-medium">{userData.name}</span>
				</div>
				<div class="btn-icon preset-faded-surface-50-950">
					<Pencil size={16} color="currentColor" />
				</div>
			</Drawer.Trigger>
			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>Edit name</Drawer.Title>
				</Drawer.Header>
				<form onsubmit={handleSubmit} class="w-full">
					<div class="flex flex-col">
						<div class="flex flex-col">
							<label class="label" for="name-input-mobile">Name</label>
							<input id="name-input-mobile" type="text" class="input w-full" bind:value={name} />
						</div>
						<Dialog.Footer>
							<button type="button" class="btn preset-tonal w-full md:w-fit" onclick={cancelEdit}>
								Cancel
							</button>
							<button type="submit" class="btn preset-filled-primary-500 w-full md:w-fit">
								Save
							</button>
						</Dialog.Footer>
					</div>
				</form>
				<Drawer.Close />
			</Drawer.Content>
		</Drawer.Root>
	{/if}
</div>
