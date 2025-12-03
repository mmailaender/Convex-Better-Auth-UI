<script lang="ts">
	// Svelte
	import { tick } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// UI Components
	// Icons
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import PencilIcon from '@lucide/svelte/icons/pencil';

	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import * as ImageCropper from '$lib/primitives/ui/image-cropper';
	import { getFileFromUrl } from '$lib/primitives/ui/image-cropper';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// API Types
	import type { FunctionReturnType } from 'convex/server';
	import type { authClient } from '$lib/auth/api/auth-client';
	type GetActiveOrganizationType = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type GetActiveUserType = FunctionReturnType<typeof api.users.queries.getActiveUser>;
	type Role = typeof authClient.$Infer.Member.role;

	// Props
	let {
		initialData
	}: {
		initialData?: {
			activeUser?: GetActiveUserType;
			activeOrganization?: GetActiveOrganizationType;
			role?: Role;
		};
	} = $props();

	// Auth
	const auth = useAuth();

	const client = useConvexClient();
	const roles = useRoles({
		// svelte-ignore state_referenced_locally
		initialData: initialData?.role
	});
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// Queries
	const userResponse = useQuery(
		api.users.queries.getActiveUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		{
			// svelte-ignore state_referenced_locally
			initialData: initialData?.activeUser
		}
	);
	const organizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		() => (auth.isAuthenticated ? {} : 'skip'),
		{
			// svelte-ignore state_referenced_locally
			initialData: initialData?.activeOrganization
		}
	);
	// Derived data
	const user = $derived(userResponse?.data ?? initialData?.activeUser);
	const activeOrganization = $derived(
		organizationResponse?.data ?? initialData?.activeOrganization
	);

	// Avatar State
	let imageLoadingStatus: 'loading' | 'loaded' | 'error' = $state('loaded');
	let isUploading: boolean = $state(false);
	let logoKey: number = $state(0); // Force re-render when logo changes
	let cropSrc: string = $state('');

	// Inline name editing state
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let nameInputEl: HTMLInputElement | null = $state(null);

	// Inline slug editing state
	let isEditingSlug: boolean = $state(false);
	let slug: string = $state('');
	let slugInputEl: HTMLInputElement | null = $state(null);

	// Initialize state when organization data is available
	$effect(() => {
		if (activeOrganization) {
			if (!isEditingName) {
				name = activeOrganization.name;
			}
			if (!isEditingSlug) {
				slug = activeOrganization.slug || '';
			}
		}
	});

	// Keep crop preview in sync with org logo
	$effect(() => {
		if (activeOrganization?.logo) {
			cropSrc = activeOrganization.logo;
		}
	});

	// Handlers

	async function handleCropped(url: string): Promise<void> {
		if (!activeOrganization) return;
		try {
			isUploading = true;
			const croppedFile = await getFileFromUrl(url, 'logo.png');
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

			const { storageId } = await response.json();
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				logoId: storageId
			});

			imageLoadingStatus = 'loading';
			logoKey += 1;
			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update logo: ${message}`);
			imageLoadingStatus = 'error';
		} finally {
			isUploading = false;
		}
	}

	async function handleNameSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();
		if (!activeOrganization) return;

		try {
			const trimmed = name.trim();
			if (!trimmed || trimmed === activeOrganization.name.trim()) {
				isEditingName = false;
				return;
			}
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				name: trimmed
			});
			isEditingName = false;
			toast.success('Organization name updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		}
	}

	async function handleSlugSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();
		if (!activeOrganization) return;

		try {
			const trimmed = slug.trim();
			const currentSlug = activeOrganization.slug || '';
			if (trimmed === '' || trimmed === currentSlug) {
				isEditingSlug = false;
				return;
			}

			// Update slug
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				slug: trimmed
			});

			// If current URL contains the old slug, replace it with the new slug
			const currentPathname = page.url.pathname;
			const urlContainsCurrentSlug =
				currentSlug &&
				(currentPathname.includes(`/${currentSlug}/`) ||
					currentPathname.endsWith(`/${currentSlug}`));

			if (urlContainsCurrentSlug) {
				const newPathname = currentPathname.replace(
					new RegExp(`/${currentSlug}(?=/|$)`, 'g'),
					`/${trimmed}`
				);
				await goto(newPathname, { replaceState: true });
			}

			isEditingSlug = false;
			toast.success('Organization slug updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		}
	}
</script>

{#if user && activeOrganization}
	<div class="flex w-full flex-col items-start gap-6">
		<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={handleCropped}>
			<ImageCropper.UploadTrigger>
				<div class="rounded-container relative cursor-pointer transition-all duration-200">
					{#key logoKey}
						<Avatar.Root
							class="rounded-container size-20"
							onStatusChange={(e) => (imageLoadingStatus = e.status)}
						>
							<Avatar.Image
								src={activeOrganization.logo}
								alt={activeOrganization.name || 'Organization'}
							/>
							<Avatar.Fallback
								class="bg-surface-300-700 hover:bg-surface-400-600/80 rounded-container duration-150 ease-in-out"
							>
								<Building2Icon class="text-surface-700-300 size-10" />
							</Avatar.Fallback>
						</Avatar.Root>
					{/key}

					{#if isUploading || imageLoadingStatus === 'loading'}
						<div
							class="bg-surface-50-950 rounded-container pointer-events-none absolute inset-0 flex items-center justify-center"
						>
							<div
								class="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"
							></div>
						</div>
					{/if}

					<div
						class="badge-icon preset-filled-surface-300-700 ring-surface-50-950 dark:ring-surface-100-900 absolute -right-1.5 -bottom-1.5 size-3 rounded-full ring-4"
					>
						<PencilIcon class="size-4" />
					</div>
				</div>
			</ImageCropper.UploadTrigger>
			<ImageCropper.Dialog>
				<ImageCropper.Cropper cropShape="rect" />
				<ImageCropper.Controls>
					<ImageCropper.Cancel />
					<ImageCropper.Crop />
				</ImageCropper.Controls>
			</ImageCropper.Dialog>
		</ImageCropper.Root>

		<!-- Inline editable organization name -->
		<div class="flex w-full flex-col gap-3">
			<div
				class={[
					'border-surface-300-700 rounded-container relative w-full border px-3.5 py-2 transition-all duration-200 ease-in-out',
					{
						'cursor-pointer': isOwnerOrAdmin && !isEditingName,
						'hover:bg-surface-200-800': isOwnerOrAdmin && !isEditingName,
						'hover:border-surface-200-800': isOwnerOrAdmin && !isEditingName
					}
				]}
			>
				<div
					class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out"
				>
					<div class="flex w-full flex-col gap-0">
						<span class="text-surface-600-400 text-xs">Organization name</span>
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
								<span class=" truncate text-sm">{activeOrganization.name}</span>
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
								<form onsubmit={handleNameSubmit} class="flex w-full flex-col gap-3">
									<input
										bind:this={nameInputEl}
										type="text"
										class="input w-full"
										bind:value={name}
									/>
									<div class="mb-1 flex gap-1.5">
										<button
											type="button"
											class="btn btn-sm preset-tonal w-full"
											onclick={() => {
												name = activeOrganization.name;
												isEditingName = false;
											}}
										>
											Cancel
										</button>
										<button
											type="submit"
											class="btn btn-sm preset-filled-primary-500 w-full"
											disabled={!name ||
												name.trim() === '' ||
												name.trim() === activeOrganization.name.trim()}
										>
											Save
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
					<!-- Edit affordance and full-area overlay button in view mode -->
					{#if isOwnerOrAdmin && !isEditingName}
						<div class="shrink-0">
							<span class="btn-icon preset-filled-surface-50-950 pointer-events-none p-2">
								<PencilIcon class="size-4" />
							</span>
						</div>
						<button
							class="absolute inset-0 h-full w-full"
							aria-label="Edit organization name"
							type="button"
							onclick={async () => {
								isEditingName = true;
								name = activeOrganization.name;
								await tick();
								nameInputEl?.focus();
								nameInputEl?.select();
							}}
						></button>
					{/if}
				</div>
			</div>

			<!-- Inline editable organization slug -->
			<div
				class={[
					'border-surface-300-700 rounded-container relative w-full border px-3.5 py-2 transition-all duration-200 ease-in-out',
					{
						'cursor-pointer': isOwnerOrAdmin && !isEditingSlug,
						'hover:bg-surface-200-800': isOwnerOrAdmin && !isEditingSlug,
						'hover:border-surface-200-800': isOwnerOrAdmin && !isEditingSlug
					}
				]}
			>
				<div
					class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out"
				>
					<div class="flex w-full flex-col gap-0">
						<span class="text-surface-600-400 text-xs">Slug</span>
						<!-- View mode (collapses when editing) -->
						<div
							class={[
								'grid transition-[grid-template-rows] duration-200 ease-in-out',
								isEditingSlug ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
								{ 'mt-1': !isEditingSlug }
							]}
							aria-hidden={isEditingSlug}
							inert={isEditingSlug}
						>
							<div class="overflow-hidden">
								<span class=" truncate text-sm">{activeOrganization.slug}</span>
							</div>
						</div>

						<!-- Edit mode (expands when editing) -->
						<div
							class={[
								'grid transition-[grid-template-rows] duration-200 ease-in-out',
								isEditingSlug ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
								{ 'mt-1': isEditingSlug }
							]}
							aria-hidden={!isEditingSlug}
							inert={!isEditingSlug}
						>
							<div class="overflow-hidden">
								<form onsubmit={handleSlugSubmit} class="flex w-full flex-col gap-3">
									<input
										bind:this={slugInputEl}
										type="text"
										class="input w-full"
										bind:value={slug}
									/>
									<div class="mb-1 flex gap-1.5">
										<button
											type="button"
											class="btn btn-sm preset-tonal w-full"
											onclick={() => {
												slug = activeOrganization.slug || '';
												isEditingSlug = false;
											}}
										>
											Cancel
										</button>
										<button
											type="submit"
											class="btn btn-sm preset-filled-primary-500 w-full"
											disabled={!slug ||
												slug.trim() === '' ||
												slug.trim() === (activeOrganization.slug || '').trim()}
										>
											Save
										</button>
									</div>
								</form>
							</div>
						</div>
					</div>
					{#if isOwnerOrAdmin && !isEditingSlug}
						<div class="shrink-0">
							<span class="btn-icon preset-filled-surface-50-950 pointer-events-none p-2">
								<PencilIcon class="size-4" />
							</span>
						</div>
						<button
							class="absolute inset-0 h-full w-full"
							aria-label="Edit organization slug"
							type="button"
							onclick={async () => {
								isEditingSlug = true;
								slug = activeOrganization.slug || '';
								await tick();
								slugInputEl?.focus();
								slugInputEl?.select();
							}}
						></button>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}
