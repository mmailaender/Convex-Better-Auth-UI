'use client';

import { useEffect, useRef, useState } from 'react';

// Convex
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Icons
import { Pencil } from 'lucide-react';

// Primitives
import { toast } from '@/components/primitives/ui/sonner';
import * as Drawer from '@/components/primitives/ui/drawer';
import * as Dialog from '@/components/primitives/ui/dialog';
import { Avatar, FileUpload } from '@skeletonlabs/skeleton-react';

// utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import { preloadImage } from '@/components/primitives/utils/preloadImage';

// types
import type { Id } from '@/convex/_generated/dataModel';
import type { FileChangeDetails } from '@zag-js/file-upload';

export default function ProfileInfo() {
	/* ─────────────────────────────────────────────  Convex queries    */
	const user = useQuery(api.users.getUser);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateUserName = useMutation(api.users.updateUserName);
	const updateAvatar = useMutation(api.users.updateAvatar);

	/* ─────────────────────────────────────────────  local state       */
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [name, setName] = useState(user?.name ?? '');

	/** single source of truth for avatar shown in the UI */
	const [avatarSrc, setAvatarSrc] = useState<string>(user?.image ?? '');

	/* keep a stable ref so another effect can read it without being a dependency */
	const shownAvatarRef = useRef(avatarSrc);
	useEffect(() => {
		shownAvatarRef.current = avatarSrc;
	}, [avatarSrc]);

	/* preload the NEW server image, but only when it changes */
	useEffect(() => {
		if (!user?.image || user.image === shownAvatarRef.current) return;

		let revoked: string | undefined;

		preloadImage(user.image)
			.then(() => {
				if (shownAvatarRef.current.startsWith('blob:')) revoked = shownAvatarRef.current;
				setAvatarSrc(user.image!);
			})
			.catch(() => void 0);

		return () => {
			if (revoked) URL.revokeObjectURL(revoked);
		};
	}, [user?.image]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await updateUserName({ name });
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
			const optimised = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const blobUrl = URL.createObjectURL(optimised);

			// cleanup previous blob
			if (avatarSrc.startsWith('blob:')) URL.revokeObjectURL(avatarSrc);

			/* optimistic UI */
			setAvatarSrc(blobUrl);

			/* upload to storage */
			const uploadUrl = await generateUploadUrl();
			const res = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimised.type },
				body: optimised
			});
			if (!res.ok) throw new Error('Failed to upload file');

			const { storageId } = await res.json();
			await updateAvatar({ storageId: storageId as Id<'_storage'> });

			toast.success('Avatar updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload avatar: ${message}`);

			// revert to server image
			setAvatarSrc(user?.image || '');
		}
	};

	/* ─────────────────────────────────────────────  skeleton while loading */
	if (!user) {
		return <div className="bg-success-200-800 h-16 w-full animate-pulse rounded-md" />;
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
			<div className="flex items-center justify-start rounded-lg pt-6 pl-0.5">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="group relative flex cursor-pointer flex-col gap-2">
						{/* key swap + fade for cross-fade */}
						<div key={avatarSrc} className="animate-fade-in-out">
							<Avatar src={avatarSrc} name={user.name} size="size-20" />
						</div>

						<div className="btn-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2">
							<Pencil size={16} color="currentColor" />
						</div>
					</div>
				</FileUpload>
			</div>

			{/* Desktop Dialog - hidden on mobile, shown on desktop */}
			<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<Dialog.Trigger
					className="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 hidden w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
					onClick={() => setIsDialogOpen(true)}
				>
					<div className="flex w-full flex-col gap-1 text-left">
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
					</div>
					<div className="btn preset-filled-surface-200-800 p-2">
						<Pencil size={16} color="currentColor" />
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
					className="border-surface-300-700 flex w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 md:hidden"
				>
					<div className="flex w-full flex-col gap-1 text-left">
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
					</div>
					<div className="btn-icon preset-faded-surface-50-950">
						<Pencil size={16} color="currentColor" />
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
