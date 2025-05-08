<script lang="ts">
	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { isOwnerOrAdmin } from '$lib/organizations/api/roles.svelte';
	const client = useConvexClient();

	// Components
	import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-svelte';
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';
	import { UploadCloud } from 'lucide-svelte';

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import { type FileChangeDetails } from '@zag-js/file-upload';

	// Queries
	const userResponse = useQuery(api.users.getUser, {});
	const organizationResponse = useQuery(api.organizations.getActiveOrganization, {});

	// State
	let isEditing: boolean = $state(false);
	let success: string = $state('');
	let error: string = $state('');
	let isUploading: boolean = $state(false);
	let logoFile: File | null = $state(null);
	let logoPreview: string = $state('');
	let profileData = $state({
		organizationId: '' as Id<'organizations'>,
		name: '',
		slug: '',
		logo: '',
		logoId: undefined as Id<'_storage'> | undefined
	});

	// Derived data
	const user = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);

	// Update profile data when activeOrganization changes
	$effect(() => {
		if (activeOrganization) {
			profileData = {
				organizationId: activeOrganization._id,
				name: activeOrganization.name,
				slug: activeOrganization.slug,
				logo: activeOrganization.logo || '',
				logoId: activeOrganization.logoId
			};
			logoPreview = activeOrganization.logo || '';
		}
	});

	/**
	 * Toggles edit mode for organization profile
	 */
	function toggleEdit(): void {
		if (!isOwnerOrAdmin) return;
		isEditing = true;
		success = '';
		error = '';
		// Reset logo preview to current logo when entering edit mode
		logoPreview = activeOrganization?.logo || '';
		logoFile = null;
	}

	/**
	 * Cancels edit mode without saving changes
	 */
	function cancelEdit(): void {
		isEditing = false;
		success = '';
		error = '';
		logoFile = null;
		// Reset logo preview when canceling
		logoPreview = activeOrganization?.logo || '';
	}

	/**
	 * Handles file selection for organization logo but doesn't upload yet
	 */
	async function handleFileChange(details: FileChangeDetails): Promise<void> {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			isUploading = true;
			error = '';
			success = '';

			// Optimize the image but don't upload yet
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true // Always convert to WebP
			});

			// Store the optimized file for later upload
			logoFile = optimizedFile;
			logoPreview = URL.createObjectURL(optimizedFile); // For preview
			success = 'Logo ready for upload!';
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			error = `Failed to process logo: ${errorMessage}`;
		} finally {
			isUploading = false;
		}
	}

	/**
	 * Handles form submission to update organization profile
	 */
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		try {
			isUploading = true;
			success = '';
			error = '';

			let logoStorageId: Id<'_storage'> | undefined;

			// Upload the new logo if one was selected
			if (logoFile) {
				// Get a storage upload URL from Convex
				const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});

				// Upload the file to Convex storage
				const response = await fetch(uploadUrl, {
					method: 'POST',
					headers: {
						'Content-Type': logoFile.type
					},
					body: logoFile
				});

				if (!response.ok) {
					throw new Error('Failed to upload file');
				}

				// Get the storage ID from the response
				const result = await response.json();
				logoStorageId = result.storageId as Id<'_storage'>;
			} else {
				logoStorageId = profileData.logoId;
			}

			// Call the Convex mutation to update the organization
			await client.mutation(api.organizations.updateOrganizationProfile, {
				organizationId: profileData.organizationId,
				name: profileData.name,
				slug: profileData.slug,
				logoId: logoStorageId
			});

			// Update the local state
			isEditing = false;
			success = 'Profile updated successfully!';
			error = '';
			logoFile = null;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			error = `Failed to update profile: ${errorMessage}`;
		} finally {
			isUploading = false;
		}
	}
</script>

{#if user && activeOrganization}
	<div class="mb-6 flex items-center gap-4">
		{#if !isEditing}
			<Avatar src={activeOrganization.logo} name={activeOrganization.name} />
			<span class="text-surface-800-200 font-medium">{activeOrganization.name}</span>
			{#if isOwnerOrAdmin}
				<button onclick={toggleEdit} class="btn">Edit</button>
			{/if}
		{:else}
			<form onsubmit={handleSubmit} class="w-full">
				<div class="flex flex-col gap-4">
					<div class="mb-4">
						<label for="logo" class="mb-1 block font-medium">Logo</label>
						<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
							<div
								class="group border-surface-600-400 hover:bg-surface-50-950 relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 transition-colors"
							>
								{#if isUploading}
									<ProgressRing
										value={null}
										size="size-14"
										meterStroke="stroke-primary-600-400"
										trackStroke="stroke-primary-50-950"
									/>
								{:else}
									<Avatar
										src={logoPreview}
										name={profileData.name.length > 0 ? profileData.name : 'Organization'}
										size="size-16"
									/>
									<div
										class="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
									>
										<UploadCloud class="size-6 text-white" />
									</div>
								{/if}
							</div>
						</FileUpload>
					</div>

					<label for="name">Name</label>
					<input
						type="text"
						name="name"
						class="input"
						value={profileData.name}
						onchange={(e) => (profileData = { ...profileData, name: e.currentTarget.value })}
					/>
					<label for="slug">Slug URL</label>
					<input
						type="text"
						name="slug"
						class="input"
						value={profileData.slug}
						onchange={(e) => (profileData = { ...profileData, slug: e.currentTarget.value })}
					/>
					<div class="flex gap-2">
						<button type="submit" class="preset-filled-primary-500 btn" disabled={isUploading}>
							Save
						</button>
						<button
							type="button"
							class="btn hover:preset-tonal"
							onclick={cancelEdit}
							disabled={isUploading}
						>
							Cancel
						</button>
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
{:else}
	<div class="h-16 w-full animate-pulse rounded-md bg-gray-200"></div>
{/if}
