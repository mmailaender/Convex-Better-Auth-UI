<script lang="ts">
	// Svelte
	import { tick } from 'svelte';

	// API
	import { useQuery, useConvexClient, useMutation } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '$lib/auth/context.svelte';
	const { api } = getAuthContext();
	const client = useConvexClient();
	const updateProfile = useMutation(api.users.mutations.updateProfile);
	const updateAvatar = useMutation(api.users.mutations.updateAvatar);

	// Icons
	import PencilIcon from '@lucide/svelte/icons/pencil';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import * as ImageCropper from '$lib/primitives/ui/image-cropper';
	import { getFileFromUrl } from '$lib/primitives/ui/image-cropper';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';

	// Types
	import type { GenericId } from 'convex/values';
	import type { GetActiveUserType } from '$lib/auth/types';

	// Props
	let { initialData }: { initialData?: { activeUser?: GetActiveUserType } } = $props();

	// Auth
	const auth = useAuth();

	// Query
	const activeUserResponse = useQuery(
		api.users.queries.getActiveUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: initialData?.activeUser
		})
	);
	const activeUser = $derived(activeUserResponse?.data);

	// State
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let loadingStatus = $state('loading');
	let isUploading: boolean = $state(false);
	let cropSrc: string = $state('');

	let nameInputEl: HTMLInputElement | null = $state(null);

	let avatarKey: number = $state(0);

	// Initialize state when user data is available
	$effect(() => {
		if (activeUser && !isEditingName) {
			name = activeUser.name;
		}
	});

	// Keep crop preview in sync with current user image
	$effect(() => {
		if (activeUser?.image && !cropSrc.startsWith('blob:')) {
			cropSrc = activeUser.image;
		}
	});

	// Handle form submission to update profile
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (!activeUser) return;

		const trimmed = name.trim();

		try {
			if (!trimmed || trimmed === activeUser.name.trim()) {
				isEditingName = false;
				return;
			}
			name = trimmed;
			isEditingName = false;
			await updateProfile(
				{ name: trimmed },
				{
					optimisticUpdate: (store) => {
						const activeUser = store.getQuery(api.users.queries.getActiveUser, {});
						if (!activeUser) return;

						store.setQuery(
							api.users.queries.getActiveUser,
							{},
							{
								...activeUser,
								name: trimmed
							}
						);
					}
				}
			);
			toast.success('Profile name updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update profile: ${errorMsg}`);
		}
	}

	// Handle cropped image from ImageCropper
	async function handleCropped(url: string): Promise<void> {
		const previousImage = activeUser?.image ?? '';
		try {
			cropSrc = url;
			isUploading = true;
			// Convert cropped URL to File, then optimize and upload
			const croppedFile = await getFileFromUrl(url, 'avatar.png');
			const optimizedFile = await optimizeImage(croppedFile, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimizedFile.type },
				body: optimizedFile
			});
			if (!response.ok) throw new Error('Failed to upload file');

			const result = await response.json();
			const storageId = result.storageId as GenericId<'_storage'>;
			await updateAvatar(
				{ storageId, optimisticImage: url },
				{
					optimisticUpdate: (store, args) => {
						if (!args.optimisticImage) return;

						const activeUser = store.getQuery(api.users.queries.getActiveUser, {});
						if (!activeUser) return;

						store.setQuery(
							api.users.queries.getActiveUser,
							{},
							{
								...activeUser,
								image: args.optimisticImage
							}
						);
					}
				}
			);

			loadingStatus = 'loaded';
			toast.success('Avatar updated successfully');
		} catch (err: unknown) {
			const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${errorMsg}`);
			cropSrc = previousImage;
			loadingStatus = 'error';
		} finally {
			isUploading = false;
		}
	}

	const displayedAvatarSrc = $derived(cropSrc || activeUser?.image || undefined);
	const showAvatarOverlay = $derived(
		!cropSrc.startsWith('blob:') &&
			(isUploading || (loadingStatus as 'loading' | 'loaded' | 'error') === 'loading')
	);
</script>

<div class="flex flex-col gap-6">
	{#if !activeUser}
		<div class="placeholder h-16 w-full animate-pulse"></div>
	{:else}
		<!-- Avatar + Upload via ImageCropper (rounded crop) -->
		<div class="rounded-base flex items-center justify-start pt-6 pl-0.5">
			<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={handleCropped}>
				<ImageCropper.UploadTrigger>
					<div
						class="rounded-container relative size-20 cursor-pointer transition-all duration-200"
					>
						<div class="relative cursor-pointer transition-colors">
							{#key avatarKey}
								<Avatar.Root class="size-20" onStatusChange={(e) => (loadingStatus = e.status)}>
									<Avatar.Image src={displayedAvatarSrc} alt={activeUser.name} />
									<Avatar.Fallback
										class="bg-surface-300-700 hover:bg-surface-400-600/80 rounded-container duration-150 ease-in-out"
									>
										<Avatar.Marble name={activeUser.name} />
									</Avatar.Fallback>
								</Avatar.Root>
							{/key}

							{#if showAvatarOverlay}
								<div
									class="bg-surface-50-950 pointer-events-none absolute inset-0 flex items-center justify-center rounded-full"
								>
									<div
										class="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"
									></div>
								</div>
							{/if}

							<div
								class="badge-icon preset-filled-surface-300-700 ring-surface-50-950 dark:ring-surface-100-900 hover:bg-surface-400-600 absolute -right-1.5 -bottom-1.5 size-3 rounded-full ring-4"
							>
								<PencilIcon class="size-4" />
							</div>
						</div>
					</div>
				</ImageCropper.UploadTrigger>
				<ImageCropper.Dialog>
					<ImageCropper.Cropper cropShape="round" />
					<ImageCropper.Controls>
						<ImageCropper.Cancel />
						<ImageCropper.Crop>Upload</ImageCropper.Crop>
					</ImageCropper.Controls>
				</ImageCropper.Dialog>
			</ImageCropper.Root>
		</div>

		<!-- Inline editable name -->
		<div
			class={[
				'border-surface-300-700 rounded-container relative w-full border px-3.5 py-2 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': !isEditingName,
					'hover:bg-surface-200-800': !isEditingName,
					'hover:border-surface-200-800': !isEditingName
				}
			]}
		>
			<div class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
				<div class="flex w-full flex-col">
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
							<span class="truncate text-sm">{activeUser.name}</span>
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
								<div class="mb-1 flex gap-1.5">
									<button
										type="button"
										class="btn btn-sm preset-tonal w-full"
										onclick={() => {
											name = activeUser.name;
											isEditingName = false;
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn btn-sm preset-filled-primary-500 w-full"
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
					<div>
						<span class="btn-icon preset-filled-surface-50-950 pointer-events-none p-2">
							<PencilIcon class="size-4" />
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
