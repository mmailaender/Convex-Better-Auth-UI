<script lang="ts">
	// API
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { api } from '$convex/_generated/api';
	import { createRoles } from '$lib/organizations/api/roles.svelte';

	// API Types
	import type { Id } from '$convex/_generated/dataModel';
	import type { FunctionReturnType } from 'convex/server';

	type ActiveOrganizationResponse = FunctionReturnType<
		typeof api.organizations.getActiveOrganization
	>;
	type UserResponse = FunctionReturnType<typeof api.users.getUser>;

	const client = useConvexClient();
	const roles = createRoles();

	// UI Components
	// Icons
	import { Pencil } from '@lucide/svelte';

	// Primitives
	import { toast } from 'svelte-sonner';
	import * as Drawer from '$lib/primitives/ui/drawer';
	import * as Dialog from '$lib/primitives/ui/dialog';
	import { Avatar, FileUpload } from '@skeletonlabs/skeleton-svelte';

	// Primitive Types
	import { type FileChangeDetails } from '@zag-js/file-upload';

	// Utils
	import { optimizeImage } from '$lib/primitives/utils/optimizeImage';
	import { preloadImage } from '$lib/primitives/utils/preloadImage';
	import { onMount } from 'svelte';

	// Props
	let {
		initialData
	}: { initialData?: { user: UserResponse; activeOrganization: ActiveOrganizationResponse } } =
		$props();

	// Queries
	const userResponse = useQuery(api.users.getUser, {}, { initialData: initialData?.user });
	const organizationResponse = useQuery(
		api.organizations.getActiveOrganization,
		{},
		{ initialData: initialData?.activeOrganization }
	);

	// State
	let isDialogOpen: boolean = $state(false);
	let isDrawerOpen: boolean = $state(false);
	let isUploading: boolean = $state(false);

	let formState = $state({ name: '', slug: '' });

	let orgData = $state({
		organizationId: '' as Id<'organizations'>,
		name: '',
		slug: '',
		logo: '',
		logoId: undefined as Id<'_storage'> | undefined
	});

	// Single source of truth for what the UI shows; never undefined
	let logoSrc: string = $state('');

	// Stable ref with whatever is currently shown
	let shownLogoRef: string = $state('');

	// Derived data
	const user = $derived(userResponse.data);
	const activeOrganization = $derived(organizationResponse.data);

	// Update shownLogoRef when logoSrc changes
	$effect(() => {
		shownLogoRef = logoSrc;
	});

	// Initialize logoSrc when activeOrganization first loads
	$effect(() => {
		if (activeOrganization && logoSrc === '') {
			logoSrc = activeOrganization.logo ?? '';
		}
	});

	// Handle new logo from Convex only after it is pre-loaded
	$effect(() => {
		if (!activeOrganization) return;

		if (!activeOrganization.logo || activeOrganization.logo === shownLogoRef) {
			// Just keep org data in sync
			orgData = {
				organizationId: activeOrganization._id,
				name: activeOrganization.name,
				slug: activeOrganization.slug || '',
				logo: activeOrganization.logo || '',
				logoId: activeOrganization.logoId
			};
			formState = {
				name: activeOrganization.name,
				slug: activeOrganization.slug || ''
			};
			return;
		}

		let revoked: string | undefined;

		preloadImage(activeOrganization.logo)
			.then(() => {
				if (shownLogoRef.startsWith('blob:')) revoked = shownLogoRef;
				logoSrc = activeOrganization.logo!;
			})
			.catch(() => void 0);

		// Cleanup function equivalent
		return () => {
			if (revoked) URL.revokeObjectURL(revoked);
		};
	});

	// Cleanup any leftover blob on component destroy
	onMount(() => {
		return () => {
			if (logoSrc.startsWith('blob:')) URL.revokeObjectURL(logoSrc);
		};
	});

	// Handlers
	function toggleDialogEdit(): void {
		if (!roles.isOwnerOrAdmin) return;
		isDialogOpen = true;
	}

	function toggleDrawerEdit(): void {
		if (!roles.isOwnerOrAdmin) return;
		isDrawerOpen = true;
	}

	function cancelEdit(): void {
		isDialogOpen = false;
		isDrawerOpen = false;
		formState = { name: orgData.name, slug: orgData.slug };
	}

	async function handleFileChange(details: FileChangeDetails): Promise<void> {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			isUploading = true;

			const optimised = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const newLogoUrl = URL.createObjectURL(optimised);

			// Clean up prior blob
			if (logoSrc.startsWith('blob:')) URL.revokeObjectURL(logoSrc);

			// Optimistic UI swap
			logoSrc = newLogoUrl;

			const uploadUrl = await client.mutation(api.storage.generateUploadUrl, {});
			const res = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimised.type },
				body: optimised
			});
			if (!res.ok) throw new Error('Failed to upload file');

			const { storageId } = await res.json();
			const logoStorageId = storageId as Id<'_storage'>;

			await client.mutation(api.organizations.updateOrganizationProfile, {
				organizationId: orgData.organizationId,
				name: orgData.name,
				slug: orgData.slug,
				logoId: logoStorageId
			});

			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update logo: ${message}`);

			// Revert to server image
			logoSrc = activeOrganization?.logo || '';
		} finally {
			isUploading = false;
		}
	}

	async function handleEditNameSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();
		try {
			isUploading = true;

			await client.mutation(api.organizations.updateOrganizationProfile, {
				organizationId: orgData.organizationId,
				name: formState.name,
				slug: formState.slug
			});

			orgData = { ...orgData, name: formState.name, slug: formState.slug };
			isDialogOpen = false;
			isDrawerOpen = false;
			toast.success('Organization details updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		} finally {
			isUploading = false;
		}
	}
</script>

{#if user && activeOrganization}
	<div class="flex flex-col items-start gap-6">
		<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
			<div
				class="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75"
			>
				<Avatar
					src={logoSrc}
					name={orgData.name || 'Organization'}
					background="bg-surface-400-600"
					size="size-20"
					rounded="rounded-container"
				/>

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
					<span class="text-surface-800-200 font-medium">{orgData.name}</span>
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
							<button
								type="submit"
								class="btn preset-filled-primary-500 w-full md:w-fit"
								disabled={isUploading}
							>
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
					<span class="text-surface-800-200 font-medium">{orgData.name}</span>
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
							<button
								type="submit"
								class="btn preset-filled-primary-500 w-full md:w-fit"
								disabled={isUploading}
							>
								Save
							</button>
						</div>
					</div>
				</form>
			</Drawer.Content>
		</Drawer.Root>
	</div>
{/if}
