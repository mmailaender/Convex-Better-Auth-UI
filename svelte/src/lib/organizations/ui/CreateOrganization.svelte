<script lang="ts">
	// SvelteKit
	import { goto } from '$app/navigation';

	/** UI **/
	// Icons
	import { UploadCloud, LogIn } from '@lucide/svelte';
	// Primitives
	import { toast } from 'svelte-sonner';
	import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-svelte';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';

	// API
	import { useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { useAuth } from '@mmailaender/convex-auth-svelte/sveltekit';
	const client = useConvexClient();

	// Types
	import type { Id } from '$convex/_generated/dataModel';
	import { type FileChangeDetails } from '@zag-js/file-upload';

	// Props
	type CreateOrganizationProps = {
		/**
		 * Optional callback that will be called when an organization is successfully created
		 */
		onSuccessfulCreate?: () => void;
		/**
		 * Optional redirect URL after successful creation
		 */
		redirectTo?: string;
	};

	const props: CreateOrganizationProps = $props();

	// Auth state
	const isLoading = $derived(useAuth().isLoading);
	const isAuthenticated = $derived(useAuth().isAuthenticated);

	// Component state
	let name: string = $state('');
	let slug: string = $state('');
	let logo: string = $state('');
	let logoFile: File | null = $state(null);
	let isUploading: boolean = $state(false);

	/**
	 * Generates a URL-friendly slug from the provided input string
	 */
	function generateSlug(input: string): string {
		return input.toLowerCase().replace(/\s+/g, '-');
	}

	/**
	 * Updates the name state and automatically generates a slug
	 */
	function handleNameInput(event: Event): void {
		const input = (event.target as HTMLInputElement).value;
		name = input;
		slug = generateSlug(input);
	}

	/**
	 * Handles file selection for organization logo but doesn't upload yet
	 */
	async function handleFileChange(details: FileChangeDetails): Promise<void> {
		const file = details.acceptedFiles[0];
		if (!file) return;

		try {
			isUploading = true;

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
			logo = URL.createObjectURL(optimizedFile); // For preview
			toast.success('Logo ready for upload!');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to process logo: ${message}`);
		} finally {
			isUploading = false;
		}
	}

	/**
	 * Handles form submission to create a new organization
	 */
	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();

		if (!name || !slug) {
			toast.error('Name and slug are required');
			return;
		}

		try {
			isUploading = true;
			let logoStorageId: Id<'_storage'> | undefined = undefined;

			// Upload the logo if one was selected
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
			}

			// Create the organization with Convex
			await client.mutation(api.organizations.createOrganization, {
				name,
				slug,
				logoId: logoStorageId
			});

			toast.success('Organization created successfully!');

			// Call the onSuccessfulCreate callback if provided
			if (props.onSuccessfulCreate) {
				props.onSuccessfulCreate();
			}

			// Navigate to the specified URL
			if (props.redirectTo) {
				goto(props.redirectTo);
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to create organization: ${message}`);
		} finally {
			isUploading = false;
		}
	}
</script>

<!-- Show loading state -->
{#if isLoading}
	<div class="mx-auto w-full max-w-md animate-pulse">
		<div class="placeholder mb-4 h-8 w-64"></div>
		<div class="placeholder mb-4 h-40 w-full"></div>
		<div class="placeholder mb-2 h-10 w-full"></div>
		<div class="placeholder h-10 w-full"></div>
	</div>

	<!-- Show message for unauthenticated users -->
{:else if !isAuthenticated}
	<div class="border-surface-200-800 mx-auto w-full max-w-md rounded-lg border p-6 text-center">
		<LogIn class="text-surface-400-600 mx-auto mb-4 size-10" />
		<h2 class="mb-2 text-xl font-semibold">Authentication Required</h2>
		<p class="text-surface-600-400 mb-4">Please sign in to create an organization</p>
	</div>

	<!-- Show the form for authenticated users -->
{:else}
	<form onsubmit={handleSubmit} class="mx-auto w-full max-w-md">
		<h2 class="mb-4 text-2xl font-bold">Create Organization</h2>

		<div class="mb-4">
			<label for="logo" class="mb-1 block font-medium">Logo</label>
			<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
				<div
					class="group border-surface-600-400 hover:bg-surface-50-950 relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed transition-colors"
				>
					{#if isUploading}
						<ProgressRing
							value={null}
							size="size-14"
							meterStroke="stroke-primary-600-400"
							trackStroke="stroke-primary-50-950"
						/>
					{:else}
						<Avatar src={logo} name={name.length > 0 ? name : 'My Organization'} size="size-16" />
						<div
							class="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
						>
							<UploadCloud class="size-6 text-white" />
						</div>
					{/if}
				</div>
			</FileUpload>
		</div>

		<div class="mb-4">
			<label for="name" class="mb-1 block font-medium">Name</label>
			<input
				type="text"
				id="name"
				value={name}
				oninput={handleNameInput}
				required
				class="input w-full"
				placeholder="My Organization"
			/>
		</div>

		<div class="mb-4">
			<label for="slug" class="mb-1 block font-medium">Slug URL</label>
			<input
				type="text"
				id="slug"
				value={slug}
				oninput={(e) => (slug = (e.target as HTMLInputElement).value)}
				required
				class="input w-full"
				placeholder="my-organization"
			/>
		</div>

		<button type="submit" class="btn variant-filled-primary w-full"> Create Organization </button>
	</form>
{/if}
