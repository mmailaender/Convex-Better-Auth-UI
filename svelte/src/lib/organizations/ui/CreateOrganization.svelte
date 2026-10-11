<script lang="ts">
	// Svelte
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { SvelteURL } from 'svelte/reactivity';

	/** UI **/
	// Icons
	import LogInIcon from '@lucide/svelte/icons/log-in';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Building2Icon from '@lucide/svelte/icons/building-2';
	import Loader2Icon from '@lucide/svelte/icons/loader-2';
	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Avatar from '#lib/primitives/ui/avatar/index.js';
	import * as ImageCropper from '#lib/primitives/ui/image-cropper/index.js';
	import { getFileFromUrl } from '#lib/primitives/ui/image-cropper/index.js';

	// Utils
	import { optimizeImage } from '#lib/primitives/utils/optimizeImage.js';

	// API
	import { useConvexClient, useQuery } from 'convex-svelte';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { getAuthContext } from '#lib/auth/context.svelte.js';
	import { safeRedirect } from '#lib/auth/utils/safeRedirect.js';
	const { api } = getAuthContext();
	const client = useConvexClient();

	// Types
	import type { GenericId } from 'convex/values';
	import type { Path } from '$app/types';

	// Auth state
	const auth = useAuth();
	const isLoading = $derived(auth.isLoading);
	const isAuthenticated = $derived(auth.isAuthenticated);

	// Queries
	const activeOrgResponse = useQuery(api.organizations.queries.getActiveOrganization, () =>
		auth.isAuthenticated ? {} : 'skip'
	);
	const activeOrganization = $derived(activeOrgResponse.data);

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

	// Component state
	let name: string = $state('');
	let slug: string = $state('');
	let logo: string = $state('');
	let logoFile: File | null = $state(null);
	let cropSrc: string = $state('');
	let isCreating: boolean = $state(false);

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
	 * Handles cropped image from ImageCropper: optimize and store for later upload
	 */
	async function handleCropped(url: string): Promise<void> {
		try {
			const croppedFile = await getFileFromUrl(url, 'logo.png');
			const optimizedFile = await optimizeImage(croppedFile, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			logoFile = optimizedFile;
			logo = URL.createObjectURL(optimizedFile);
			cropSrc = logo;
			toast.success('Logo ready for upload!');
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to process logo: ${message}`);
		}
	}

	/**
	 * Resets the form fields and clears any staged logo/crop state.
	 */
	function resetForm(): void {
		// Revoke preview URL if set to avoid memory leaks
		if (logo && logo.startsWith('blob:')) {
			try {
				URL.revokeObjectURL(logo);
			} catch {
				// no-op
			}
		}
		name = '';
		slug = '';
		logo = '';
		logoFile = null;
		cropSrc = '';
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

		isCreating = true;

		try {
			let logoStorageId: GenericId<'_storage'> | undefined = undefined;

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
				logoStorageId = result.storageId as GenericId<'_storage'>;
			}

			const currentUrl = new SvelteURL(window.location.href);
			const pathSegments = currentUrl.pathname.split('/');
			const activeOrgSlug = activeOrganization?.slug;

			// Create the organization
			await client.mutation(api.organizations.mutations.createOrganization, {
				name,
				slug,
				logoId: logoStorageId
			});
			toast.success('Organization created successfully!');
			// Call the onSuccessfulCreate callback if provided
			if (props.onSuccessfulCreate) props.onSuccessfulCreate();

			// Reset form state so the next creation starts blank
			resetForm();

			// Redirect
			const redirectUrl = props.redirectTo ?? page.url.searchParams.get('redirectTo');
			// Navigate to the specified URL if it is on this site, else home
			if (redirectUrl) {
				const target = safeRedirect(redirectUrl, '/', page.url.origin);
				// SvelteKit 3's goto rejects paths that aren't app pages; fall back to a full page load
				// eslint-disable-next-line svelte/no-navigation-without-resolve -- safeRedirect returns a same-origin path; resolve() would read [name] in its query as a route parameter and collapse // in its hash
				void goto(target).catch(() => window.location.assign(target));
			} else {
				let needsRedirect = false;
				if (activeOrgSlug) {
					// Check each path segment for the organization ID
					for (let i = 0; i < pathSegments.length; i++) {
						if (pathSegments[i] === activeOrgSlug) {
							// Found the organization ID in the URL path
							pathSegments[i] = activeOrganization?.slug;
							needsRedirect = true;
							break;
						}
					}
				}

				if (needsRedirect) {
					// Reconstruct the URL with the new organization ID
					currentUrl.pathname = pathSegments.join('/');
					const nextPath = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
					void goto(resolve(nextPath as Path), { refreshAll: true });
				}
			}
		} catch (err: unknown) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to create organization: ${message}`);
		} finally {
			isCreating = false;
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
		<LogInIcon class="text-surface-400-600 mx-auto mb-4 size-10" />
		<h2 class="mb-2 text-xl font-semibold">Authentication Required</h2>
		<p class="text-surface-600-400 mb-4">Please sign in to create an organization</p>
	</div>

	<!-- Show the form for authenticated users -->
{:else}
	<form onsubmit={handleSubmit} class="mx-auto w-full px-6 pb-6">
		<div class="my-6">
			<ImageCropper.Root bind:src={cropSrc} accept="image/*" onCropped={handleCropped}>
				<ImageCropper.UploadTrigger>
					<div
						class="rounded-container relative size-20 cursor-pointer transition-all duration-200"
					>
						<Avatar.Root class="rounded-container size-20">
							<Avatar.Image src={logo} alt={name.length > 0 ? name : 'My Organization'} />
							<Avatar.Fallback
								class="bg-surface-300-700 hover:bg-surface-400-600/80 rounded-container duration-150 ease-in-out"
							>
								<Building2Icon class="text-surface-700-300 size-10" />
							</Avatar.Fallback>
						</Avatar.Root>
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
						<ImageCropper.Crop>Upload</ImageCropper.Crop>
					</ImageCropper.Controls>
				</ImageCropper.Dialog>
			</ImageCropper.Root>
		</div>

		<div class="flex flex-col gap-5">
			<div>
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
			<div>
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
			<button
				type="submit"
				class="btn preset-filled-primary-500"
				disabled={isCreating}
				aria-busy={isCreating}
			>
				{#if isCreating}
					<Loader2Icon class="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
					Creating...
				{:else}
					Create Organization
				{/if}
			</button>
		</div>
	</form>
{/if}

<style>
	:global(.svelte-easy-crop-area) {
		border-radius: var(--radius-container);
	}
</style>
