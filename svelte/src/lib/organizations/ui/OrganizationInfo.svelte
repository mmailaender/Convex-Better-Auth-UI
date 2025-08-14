<script lang="ts">
	// SvelteKit
	import { goto } from '$app/navigation';
	import { page } from '$app/state';

	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useRoles } from '$lib/organizations/api/roles.svelte';

	// API Types
	import type { FunctionReturnType } from 'convex/server';

	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.queries.getActiveOrganization
	>;
	type UserResponse = FunctionReturnType<typeof api.users.queries.getActiveUser>;

	const client = useConvexClient();
	const roles = useRoles();
	const isOwnerOrAdmin = $derived(roles.hasOwnerOrAdminRole);

	// UI Components
	// Icons
	import { Building2, Pencil } from '@lucide/svelte';

	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	// Primitive Types
	import { type FileChangeDetails } from '@zag-js/file-upload';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';
	import { tick } from 'svelte';

	// Props
	let {
		initialData
	}: {
		initialData?: {
			user?: UserResponse;
			activeOrganization?: ActiveOrganizationResponse;
		};
	} = $props();

	// Queries
	const userResponse = useQuery(
		api.users.queries.getActiveUser,
		{},
		{ initialData: initialData?.user }
	);
	const organizationResponse = useQuery(
		api.organizations.queries.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);

	// State
	let imageLoadingStatus: 'loading' | 'loaded' | 'error' = $state('loaded');
	let isUploading: boolean = $state(false);
	let logoKey: number = $state(0); // Force re-render when logo changes

	// Inline name editing state
	let isEditingName: boolean = $state(false);
	let name: string = $state('');
	let nameInputEl: HTMLInputElement | null = $state(null);

	// Inline slug editing state
	let isEditingSlug: boolean = $state(false);
	let slug: string = $state('');
	let slugInputEl: HTMLInputElement | null = $state(null);

	// Derived data
	const user = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);

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

	// Handlers

	async function handleFileChange(details: FileChangeDetails): Promise<void> {
		const file = details.acceptedFiles.at(0);
		if (!file || !activeOrganization) return;

		try {
			// Show spinner immediately while uploading
			isUploading = true;
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
			if (!response.ok) throw new Error('Failed to upload file');

			const { storageId } = await response.json();

			await client.mutation(api.organizations.mutations.updateOrganizationProfile, {
				logoId: storageId
			});

			// Reset loading status and force logo to re-render with new image - this will trigger new loading
			imageLoadingStatus = 'loading';
			logoKey += 1;

			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update logo: ${message}`);
			// Reset loading status on error
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
	<div class="flex flex-col items-start gap-6">
		<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
			<div
				class="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75"
			>
				{#key logoKey}
					<Avatar.Root
						class="rounded-container size-20"
						onStatusChange={(e) => (imageLoadingStatus = e.status)}
					>
						<Avatar.Image
							src={activeOrganization.logo}
							alt={activeOrganization.name || 'Organization'}
						/>
						<Avatar.Fallback class="bg-surface-400-600 rounded-container size-20">
							<Building2 class="size-10" />
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
					class="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2"
				>
					<Pencil class="size-4" />
				</div>
			</div>
		</FileUpload>

		<!-- Inline editable organization name -->
		<div
			class={[
				'border-surface-300-700 rounded-container relative w-full border py-2 pr-3 pl-4 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': isOwnerOrAdmin && !isEditingName,
					'hover:bg-surface-50-950': isOwnerOrAdmin && !isEditingName,
					'hover:border-surface-50-950': isOwnerOrAdmin && !isEditingName
				}
			]}
		>
			<div class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
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
							<span class="text-surface-800-200 truncate font-medium"
								>{activeOrganization.name}</span
							>
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
								<input bind:this={nameInputEl} type="text" class="input w-full" bind:value={name} />
								<div class="flex gap-2">
									<button
										type="button"
										class="btn preset-tonal w-full md:w-fit"
										onclick={() => {
											name = activeOrganization.name;
											isEditingName = false;
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn preset-filled-primary-500 w-full md:w-fit"
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
						<span class="btn preset-filled-surface-200-800 pointer-events-none p-2">
							<Pencil class="size-4" />
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
				'border-surface-300-700 rounded-container relative w-full border py-2 pr-3 pl-4 transition-all duration-200 ease-in-out',
				{
					'cursor-pointer': isOwnerOrAdmin && !isEditingSlug,
					'hover:bg-surface-50-950': isOwnerOrAdmin && !isEditingSlug,
					'hover:border-surface-50-950': isOwnerOrAdmin && !isEditingSlug
				}
			]}
		>
			<div class="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
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
							<span class="text-surface-800-200 truncate font-medium"
								>{activeOrganization.slug}</span
							>
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
								<input bind:this={slugInputEl} type="text" class="input w-full" bind:value={slug} />
								<div class="flex gap-2">
									<button
										type="button"
										class="btn preset-tonal w-full md:w-fit"
										onclick={() => {
											slug = activeOrganization.slug || '';
											isEditingSlug = false;
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										class="btn preset-filled-primary-500 w-full md:w-fit"
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
						<span class="btn preset-filled-surface-200-800 pointer-events-none p-2">
							<Pencil class="size-4" />
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
{/if}
