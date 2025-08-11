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
	import * as Drawer from '$lib/primitives/ui/drawer';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import * as Avatar from '$lib/primitives/ui/avatar';
	import { FileUpload } from '@skeletonlabs/skeleton-svelte';

	// Primitive Types
	import { type FileChangeDetails } from '@zag-js/file-upload';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';

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
	let isDialogOpen: boolean = $state(false);
	let isDrawerOpen: boolean = $state(false);
	let imageLoadingStatus: 'loading' | 'loaded' | 'error' = $state('loaded');
	let isUploading: boolean = $state(false);
	let logoKey: number = $state(0); // Force re-render when logo changes

	let formState = $state({ name: '', slug: '' });

	// Derived data
	const user = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);

	// Initialize state when organization data is available
	$effect(() => {
		if (activeOrganization) {
			if (formState.name === '') {
				formState.name = activeOrganization.name;
			}
			if (formState.slug === '') {
				formState.slug = activeOrganization.slug || '';
			}
		}
	});

	// Handlers
	function toggleDialogEdit(): void {
		if (!isOwnerOrAdmin) return;
		isDialogOpen = true;
	}

	function toggleDrawerEdit(): void {
		if (!isOwnerOrAdmin) return;
		isDrawerOpen = true;
	}

	function cancelEdit(): void {
		isDialogOpen = false;
		isDrawerOpen = false;
		if (activeOrganization) {
			formState = {
				name: activeOrganization.name,
				slug: activeOrganization.slug || ''
			};
		}
	}

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

	async function handleEditNameSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();
		if (!activeOrganization) return;

		try {
			// Store the current slug before updating
			const currentSlug = activeOrganization.slug;
			const currentPathname = page.url.pathname;

			// Check if current URL contains the active organization slug
			const urlContainsCurrentSlug =
				currentSlug &&
				(currentPathname.includes(`/${currentSlug}/`) ||
					currentPathname.includes(`/${currentSlug}`));

			// Update the organization profile
			const updates: { name?: string; slug?: string } = {};
			if (activeOrganization.name !== formState.name) {
				updates.name = formState.name;
			}
			if (activeOrganization.slug !== formState.slug) {
				updates.slug = formState.slug;
			}
			await client.mutation(api.organizations.mutations.updateOrganizationProfile, updates);

			// Close the modals
			isDialogOpen = false;
			isDrawerOpen = false;

			// Handle URL redirection if slug was changed
			if (
				urlContainsCurrentSlug &&
				currentSlug &&
				formState.slug &&
				currentSlug !== formState.slug
			) {
				// Replace the old slug with the new slug in the URL
				const newPathname = currentPathname.replace(
					new RegExp(`/${currentSlug}(?=/|$)`, 'g'),
					`/${formState.slug}`
				);

				// Navigate to the new URL
				await goto(newPathname, { replaceState: true });
			}

			toast.success('Organization details updated successfully');
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
						onStatusChange={(e) => {
							console.log('Avatar status change:', e.status, 'URL:', activeOrganization.logo);
							imageLoadingStatus = e.status;
						}}
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

		<!-- Desktop Dialog - hidden on mobile, shown on desktop -->
		<Dialog.Root bind:open={isDialogOpen}>
			<Dialog.Trigger
				class="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 rounded-container hidden w-full flex-row content-center items-center border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
				onclick={toggleDialogEdit}
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Organization name</span>
					<span class="text-surface-800-200 font-medium">{activeOrganization.name}</span>
				</div>
				<div class="btn preset-filled-surface-200-800 p-2">
					<Pencil class="size-4" />
				</div>
			</Dialog.Trigger>

			<Dialog.Content class="md:max-w-108">
				<Dialog.Header>
					<Dialog.Title>Edit Organization Name</Dialog.Title>
				</Dialog.Header>
				<form onsubmit={handleEditNameSubmit} class="w-full">
					<div class="flex flex-col gap-4">
						<div>
							<label for="name" class="label"> Organization Name </label>
							<input type="text" name="name" class="input" bind:value={formState.name} required />
						</div>

						<div>
							<label for="slug" class="label"> Slug URL </label>
							<input type="text" name="slug" class="input" bind:value={formState.slug} />
						</div>

						<div class="flex justify-end gap-2 pt-6 md:flex-row">
							<button type="button" class="btn preset-tonal w-full md:w-fit" onclick={cancelEdit}>
								Cancel
							</button>
							<button type="submit" class="btn preset-filled-primary-500 w-full md:w-fit">
								Save
							</button>
						</div>
					</div>
				</form>
			</Dialog.Content>
		</Dialog.Root>

		<!-- Mobile Drawer - shown on mobile, hidden on desktop -->
		<Drawer.Root bind:open={isDrawerOpen}>
			<Drawer.Trigger
				onclick={toggleDrawerEdit}
				class="border-surface-300-700 rounded-container flex w-full flex-row content-center items-center border py-2 pr-3 pl-4 md:hidden"
			>
				<div class="flex w-full flex-col gap-1 text-left">
					<span class="text-surface-600-400 text-xs">Organization name</span>
					<span class="text-surface-800-200 font-medium">{activeOrganization.name}</span>
				</div>
				<div class="btn-icon preset-filled-surface-200-800">
					<Pencil class="size-4" />
				</div>
			</Drawer.Trigger>

			<Drawer.Content>
				<Drawer.Header>
					<Drawer.Title>Edit Organization Name</Drawer.Title>
				</Drawer.Header>
				<form onsubmit={handleEditNameSubmit} class="w-full">
					<div class="flex flex-col gap-4">
						<div>
							<label for="name" class="label"> Organization Name </label>
							<input type="text" name="name" class="input" bind:value={formState.name} required />
						</div>

						<div>
							<label for="slug" class="label"> Slug URL </label>
							<input type="text" name="slug" class="input" bind:value={formState.slug} />
						</div>

						<div class="flex justify-end gap-2 pt-6 md:flex-row">
							<button type="button" class="btn preset-tonal w-full md:w-fit" onclick={cancelEdit}>
								Cancel
							</button>
							<button type="submit" class="btn preset-filled-primary-500 w-full md:w-fit">
								Save
							</button>
						</div>
					</div>
				</form>
			</Drawer.Content>
		</Drawer.Root>
	</div>
{/if}
