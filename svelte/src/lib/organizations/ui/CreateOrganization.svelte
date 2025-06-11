<script lang="ts">
	// SvelteKit
	import { goto } from '$app/navigation';

	/** UI **/
	// Icons
	import { UploadCloud, LogIn, Pencil } from '@lucide/svelte';
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
			let logoStorageId: Id<'_storage'> | undefined = undefined;

			// Upload the logo if one was selected
			if (logoFile) {
				const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});
				const response = await fetch(uploadUrl, {
					method: 'POST',
					headers: {
						'Content-Type': logoFile.type
					},
					body: logoFile
				});
				if (!response.ok) throw new Error('Failed to upload file');
				const result = await response.json();
				logoStorageId = result.storageId as Id<'_storage'>;
			}

			// Create the organization
			await client.mutation(api.organizations.createOrganization, {
				name,
				slug,
				logoId: logoStorageId
			});
			toast.success('Organization created successfully!');
			// Call the onSuccessfulCreate callback if provided
			if (props.onSuccessfulCreate) props.onSuccessfulCreate();
			// Navigate to the specified URL
			if (props.redirectTo) goto(props.redirectTo);
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to create organization: ${message}`);
		}
	}
</script>

<!-- Show loading state -->
{#if isLoading}
	<div class="mx-auto w-full max-w-md animate-pulse">
		<div class="placeholder mb-4 h-8 w-full"></div>
		<div class="placeholder mb-4 h-40 w-full"></div>
		<div class="placeholder mb-2 h-10 w-full"></div>
		<div class="placeholder h-10 w-full"></div>
	</div>

	<!-- Show message for unauthenticated users -->
{:else if !isAuthenticated}
	<div
		class="border-surface-200-800 rounded-container mx-auto w-full max-w-md border p-6 text-center"
	>
		<LogIn class="text-surface-400-600 mx-auto mb-4 size-10" />
		<h2 class="mb-2 text-xl font-semibold">Authentication Required</h2>
		<p class="text-surface-600-400 mb-4">Please sign in to create an organization</p>
	</div>

	<!-- Show the form for authenticated users -->
{:else}
	<form onsubmit={handleSubmit} class="mx-auto w-full">
		<div class="my-6">
			<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
				<div
					class="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75"
				>
					<Avatar
						src={logo}
						name={name.length > 0 ? name : 'My Organization'}
						background="bg-surface-400-600"
						size="size-20"
						rounded="rounded-base"
					/>
					<div
						class="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2"
					>
						<Pencil class="size-4" />
					</div>
				</div>
			</FileUpload>
		</div>

		<div class="flex flex-col gap-2">
			<div class="mb-4">
				<label for="name" class="label">Name</label>
				<input
					type="text"
					id="name"
					value={name}
					oninput={handleNameInput}
					required
					class="input w-full"
					placeholder="My Organization..."
				/>
			</div>
			<div class="mb-4">
				<label for="slug" class="label">Slug URL</label>
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
		</div>

		<div class="flex justify-end gap-2 pt-6 md:flex-row">
			<button type="submit" class="btn preset-filled-primary-500">Create Organization</button>
		</div>
	</form>
{/if}
