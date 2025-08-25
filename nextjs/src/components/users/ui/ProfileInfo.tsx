'use client';

import { useEffect, useState } from 'react';

// API
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../../../lib/auth/api/auth-client';

// Icons
import { Pencil } from 'lucide-react';

// Primitives
import { toast } from 'sonner';
import * as Drawer from '@/components/primitives/ui/drawer';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Avatar from '@/components/primitives/ui/avatar';
import { FileUpload } from '@skeletonlabs/skeleton-react';

// utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';

// types
import type { FileChangeDetails } from '@zag-js/file-upload';

export default function ProfileInfo() {
	/* ─────────────────────────────────────────────  Convex queries    */
	const user = useQuery(api.users.queries.getActiveUser);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateAvatar = useMutation(api.users.mutations.updateAvatar);

	/* ─────────────────────────────────────────────  local state       */
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [name, setName] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const [imageLoadingStatus, setImageLoadingStatus] = useState<
		'idle' | 'loading' | 'loaded' | 'error'
	>('idle');

	// Initialize state when user data is available
	useEffect(() => {
		if (user && name === '') {
			setName(user.name);
		}
	}, [user, name]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await authClient.updateUser({ name });
			setIsDialogOpen(false);
			setIsDrawerOpen(false);
			toast.success('Profile name updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update profile: ${message}`);
		}
	};

	const handleFileChange = async (details: FileChangeDetails) => {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			setIsUploading(true);

			// Optimize the image before upload
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

			// Update the user's avatar with the storage ID
			await updateAvatar({ storageId });

			toast.success('Avatar updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${message}`);
		} finally {
			setIsUploading(false);
		}
	};

	/* ─────────────────────────────────────────────  skeleton while loading */
	if (!user) {
		return <div className="bg-success-200-800 rounded-base h-16 w-full animate-pulse" />;
	}

	/* ─────────────────────────────────────────────  edit form */
	const form = (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex flex-col">
				<label className="flex flex-col">
					<span className="label">Name</span>
					<input
						type="text"
						className="input w-full"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</label>
				<Dialog.Footer>
					<Dialog.Close className="btn preset-tonal w-full md:w-fit">Cancel</Dialog.Close>
					<button type="submit" className="btn preset-filled-primary-500 w-full md:w-fit">
						Save
					</button>
				</Dialog.Footer>
			</div>
		</form>
	);

	/* ─────────────────────────────────────────────  component UI */
	return (
		<div className="flex flex-col gap-6">
			{/* avatar + upload */}
			<div className="rounded-base flex items-center justify-start pt-6 pl-0.5">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75">
						<Avatar.Root className="bg-surface-400-600 size-20">
							<Avatar.Image
								src={isUploading ? undefined : (user.image as string | undefined)}
								alt={user.name}
								onLoadingStatusChange={(status) => {
									setImageLoadingStatus(status);
								}}
							/>
							<Avatar.Fallback>
								{imageLoadingStatus === 'loading' || isUploading ? (
									<div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
										<div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent"></div>
									</div>
								) : (
									<Avatar.Marble name={user.name} />
								)}
							</Avatar.Fallback>
						</Avatar.Root>

						<div className="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2">
							<Pencil className="size-4" />
						</div>
					</div>
				</FileUpload>
			</div>

			{/* Desktop Dialog - hidden on mobile, shown on desktop */}
			<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<Dialog.Trigger
					className="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 rounded-container hidden w-full flex-row content-center items-center border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
					onClick={() => setIsDialogOpen(true)}
				>
					<div className="flex w-full flex-col gap-1 text-left">
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
					</div>
					<div className="btn preset-filled-surface-200-800 p-2">
						<Pencil className="size-4" />
					</div>
				</Dialog.Trigger>

				<Dialog.Content className="w-full max-w-md">
					<Dialog.Header>
						<Dialog.Title>Edit name</Dialog.Title>
					</Dialog.Header>
					{form}
				</Dialog.Content>
			</Dialog.Root>

			{/* Mobile Drawer - shown on mobile, hidden on desktop */}
			<Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<Drawer.Trigger
					onClick={() => setIsDrawerOpen(true)}
					className="border-surface-300-700 rounded-base flex w-full flex-row content-center items-center border py-2 pr-3 pl-4 md:hidden"
				>
					<div className="flex w-full flex-col gap-1 text-left">
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
					</div>
					<div className="btn-icon preset-faded-surface-50-950">
						<Pencil className="size-4" />
					</div>
				</Drawer.Trigger>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Edit name</Drawer.Title>
					</Drawer.Header>
					{form}
					<Drawer.CloseX />
				</Drawer.Content>
			</Drawer.Root>
		</div>
	);
}
