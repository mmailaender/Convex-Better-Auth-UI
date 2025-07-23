'use client';

// React
import { useEffect, useState } from 'react';

// API
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRoles } from '@/components/organizations/api/hooks';
import { authClient } from '@/components/auth/lib/auth-client';
import { FunctionArgs } from 'convex/server';

// Icons
import { Building2, Pencil } from 'lucide-react';

// Primitives
import { toast } from 'sonner';
import * as Drawer from '@/components/primitives/ui/drawer';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Avatar from '@/components/primitives/ui/avatar';
import { FileUpload } from '@skeletonlabs/skeleton-react';

// utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';

// Types
import type { FileChangeDetails } from '@zag-js/file-upload';
import { ConvexError } from 'convex/values';
type UpdateOrganizationProfileInput = FunctionArgs<
	typeof api.organizations.mutations.updateOrganizationProfile
>;

export default function OrganizationInfo() {
	/* ───────────────────────────────────────────── state & queries ── */
	const { data } = authClient.useSession();
	const user = data?.user;
	const { data: activeOrganization, refetch: refetchActiveOrganization } =
		authClient.useActiveOrganization();
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;

	const updateOrganization = useMutation(api.organizations.mutations.updateOrganizationProfile);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [isUploading, setIsUploading] = useState(false);
	const [imageLoadingStatus, setImageLoadingStatus] = useState<
		'idle' | 'loading' | 'loaded' | 'error'
	>('idle');

	const [formState, setFormState] = useState({ name: '', slug: '' });
	const [displayLogoSrc, setDisplayLogoSrc] = useState('');

	// Initialize state when organization data is available
	useEffect(() => {
		if (activeOrganization) {
			if (formState.name === '') {
				setFormState((prev) => ({
					...prev,
					name: activeOrganization.name
				}));
			}
			if (formState.slug === '') {
				setFormState((prev) => ({
					...prev,
					slug: activeOrganization.slug || ''
				}));
			}
			if (displayLogoSrc === '') {
				setDisplayLogoSrc(activeOrganization.logo || '');
			}
		}
	}, [activeOrganization, formState.name, formState.slug, displayLogoSrc]);

	if (!user || !activeOrganization) return null;

	/* ───────────────────────────────────────────── handlers ────────── */
	const toggleDialogEdit = () => {
		if (!isOwnerOrAdmin) return;
		setIsDialogOpen(true);
	};
	const toggleDrawerEdit = () => {
		if (!isOwnerOrAdmin) return;
		setIsDrawerOpen(true);
	};

	const cancelEdit = () => {
		setIsDialogOpen(false);
		setIsDrawerOpen(false);
		if (activeOrganization) {
			setFormState({
				name: activeOrganization.name,
				slug: activeOrganization.slug
			});
		}
	};

	const handleFileChange = async (details: FileChangeDetails) => {
		const file = details.acceptedFiles.at(0);
		if (!file || !activeOrganization) return;

		try {
			setIsUploading(true);

			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			// Get a storage upload URL from Convex
			const uploadUrl = await generateUploadUrl();
			// Upload the file to Convex storage
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimizedFile.type },
				body: optimizedFile
			});
			if (!response.ok) throw new Error('Failed to upload file');

			const { storageId } = await response.json();

			await updateOrganization({
				logoId: storageId
			});
			await refetchActiveOrganization();

			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update logo: ${message}`);
		} finally {
			setIsUploading(false);
		}
	};

	const handleEditNameSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!activeOrganization) return;

		try {
			setIsUploading(true);

			const updates: Partial<UpdateOrganizationProfileInput> = {};
			if (activeOrganization.name !== formState.name) {
				updates.name = formState.name;
			}
			if (activeOrganization.slug !== formState.slug) {
				updates.slug = formState.slug;
			}
			await updateOrganization(updates);
			refetchActiveOrganization();

			setIsDialogOpen(false);
			setIsDrawerOpen(false);
			toast.success('Organization details updated successfully');
		} catch (err) {
			if (err instanceof ConvexError) {
				toast.error(err.data);
				return;
			}
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		} finally {
			setIsUploading(false);
		}
	};

	/* ───────────────────────────────────────────── view ────────────── */
	const form = (
		<form onSubmit={handleEditNameSubmit} className="w-full">
			<div className="flex flex-col gap-4">
				<div>
					<label htmlFor="name" className="label">
						Organization Name
					</label>
					<input
						type="text"
						name="name"
						className="input"
						value={formState.name}
						onChange={(e) => setFormState({ ...formState, name: e.target.value })}
						required
					/>
				</div>

				<div>
					<label htmlFor="slug" className="label">
						Slug URL
					</label>
					<input
						type="text"
						name="slug"
						className="input"
						value={formState.slug}
						onChange={(e) => {
							setFormState({ ...formState, slug: e.target.value });
						}}
					/>
				</div>

				<div className="flex justify-end gap-2 pt-6 md:flex-row">
					<button type="button" className="btn preset-tonal w-full md:w-fit" onClick={cancelEdit}>
						Cancel
					</button>
					<button
						type="submit"
						className="btn preset-filled-primary-500 w-full md:w-fit"
						disabled={isUploading}
					>
						Save
					</button>
				</div>
			</div>
		</form>
	);

	return (
		<div className="flex flex-col items-start gap-6">
			<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
				<div className="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75">
					<Avatar.Root className="rounded-container size-20">
						<Avatar.Image
							src={isUploading ? undefined : (activeOrganization?.logo as string | undefined)}
							alt={activeOrganization.name || 'Organization'}
							onLoadingStatusChange={(status) => {
								setImageLoadingStatus(status);
							}}
						/>
						<Avatar.Fallback className="bg-surface-400-600 rounded-container size-20">
							{imageLoadingStatus === 'loading' || isUploading ? (
								<div className="rounded-container absolute inset-0 flex items-center justify-center bg-black/50">
									<div className="h-6 w-6 animate-spin rounded-full border-b-2 border-white"></div>
								</div>
							) : (
								<Building2 className="size-10" />
							)}
						</Avatar.Fallback>
					</Avatar.Root>

					<div className="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2">
						<Pencil className="size-4" />
					</div>
				</div>
			</FileUpload>

			{/* Desktop Dialog - hidden on mobile, shown on desktop */}
			<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<Dialog.Trigger
					className="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 rounded-container hidden w-full flex-row content-center items-center border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
					onClick={toggleDialogEdit}
				>
					<div className="flex w-full flex-col gap-1 text-left">
						<span className="text-surface-600-400 text-xs">Organization name</span>
						<span className="text-surface-800-200 font-medium">{activeOrganization.name}</span>
					</div>
					<div className="btn preset-filled-surface-200-800 p-2">
						<Pencil className="size-4" />
					</div>
				</Dialog.Trigger>

				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>Edit Organization Name</Dialog.Title>
					</Dialog.Header>
					{form}
				</Dialog.Content>
			</Dialog.Root>

			{/* Mobile Drawer - shown on mobile, hidden on desktop */}
			<Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<Drawer.Trigger
					onClick={toggleDrawerEdit}
					className="border-surface-300-700 rounded-container flex w-full flex-row content-center items-center border py-2 pr-3 pl-4 md:hidden"
				>
					<div className="flex w-full flex-col gap-1 text-left">
						<span className="text-surface-600-400 text-xs">Organization name</span>
						<span className="text-surface-800-200 font-medium">{activeOrganization.name}</span>
					</div>
					<div className="btn-icon preset-filled-surface-200-800">
						<Pencil className="size-4" />
					</div>
				</Drawer.Trigger>

				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Edit Organization Name</Drawer.Title>
					</Drawer.Header>
					{form}
				</Drawer.Content>
			</Drawer.Root>
		</div>
	);
}
