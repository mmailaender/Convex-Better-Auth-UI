import { useState, useEffect } from 'react';

// API
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Pencil } from 'lucide-react';

// Utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
	DrawerDescription
} from '@/components/primitives/ui/drawer';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger
} from '@/components/primitives/ui/dialog';
import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-react';

// Types
import type { Id } from '@/convex/_generated/dataModel';
import { type FileChangeDetails } from '@zag-js/file-upload';

export default function ProfileInfo() {
	const [isDesktop, setIsDesktop] = useState<boolean>(
		typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
	);

	useEffect(() => {
		const mediaQuery = window.matchMedia('(min-width: 768px)');
		const handleChange = () => setIsDesktop(mediaQuery.matches);

		mediaQuery.addEventListener('change', handleChange);
		return () => mediaQuery.removeEventListener('change', handleChange);
	}, []);

	const user = useQuery(api.users.getUser);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateUserName = useMutation(api.users.updateUserName);
	const updateAvatar = useMutation(api.users.updateAvatar);

	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [name, setName] = useState<string>('');

	if (user && name === '') {
		setName(user.name);
	}

	const cancelEdit = (): void => {
		setIsEditing(false);
		setSuccessMessage('');
		setErrorMessage('');
	};

	const handleSubmit = async (event: React.FormEvent): Promise<void> => {
		event.preventDefault();
		try {
			await updateUserName({ name });
			setIsEditing(false);
			setSuccessMessage('Profile updated successfully!');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setErrorMessage(`Failed to update profile: ${errorMessage}`);
		}
	};

	const handleFileChange = async (details: FileChangeDetails): Promise<void> => {
		const file = details.acceptedFiles.at(0);
		if (!file) return;
		try {
			setIsUploading(true);
			setErrorMessage('');
			setSuccessMessage('');
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});
			const uploadUrl = await generateUploadUrl();
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: {
					'Content-Type': optimizedFile.type
				},
				body: optimizedFile
			});
			if (!response.ok) throw new Error('Failed to upload file');
			const result = await response.json();
			const storageId = result.storageId as Id<'_storage'>;
			await updateAvatar({ storageId });
			setSuccessMessage('Avatar updated successfully!');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setErrorMessage(`Failed to upload avatar: ${errorMessage}`);
		} finally {
			setIsUploading(false);
		}
	};

	if (!user) return <div className="bg-success-200-800 h-16 w-full animate-pulse rounded-md"></div>;

	const form = (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex flex-col">
				<div className="flex flex-col">
					<label className="label">Name</label>
					<input
						type="text"
						className="input w-full"
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
				</div>
				<DialogFooter>
					<button type="button" className="btn preset-tonal w-full md:w-fit" onClick={cancelEdit}>
						Cancel
					</button>
					<button type="submit" className="btn preset-filled-primary-500 w-full md:w-fit">
						Save
					</button>
				</DialogFooter>
			</div>
		</form>
	);

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-center justify-start rounded-lg pt-6 pl-0.5">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="group relative flex cursor-pointer flex-col gap-2">
						<Avatar src={user.image || ''} name={user.name} size="size-20" />
						<div className="btn-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2">
							<Pencil size={16} color="currentColor" />
						</div>
						{isUploading && (
							<ProgressRing
								value={null}
								size="size-14"
								meterStroke="stroke-primary-600-400"
								trackStroke="stroke-primary-50-950"
							/>
						)}
					</div>
				</FileUpload>
			</div>

			{isDesktop ? (
				<Dialog open={isEditing} onOpenChange={setIsEditing}>
					<DialogTrigger
						className="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 hidden w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
						onClick={() => setIsEditing(true)}
					>
						<div className="flex w-full flex-col gap-1 text-left">
							<span className="text-surface-600-400 text-xs">Name</span>
							<span className="text-surface-800-200 font-medium">{user.name}</span>
						</div>
						<div className="btn preset-filled-surface-200-800 p-2">
							<Pencil size={16} color="currentColor" />
						</div>
					</DialogTrigger>

					<DialogContent className="w-full max-w-md">
						<DialogHeader>
							<DialogTitle>Edit name</DialogTitle>
						</DialogHeader>
						{form}
					</DialogContent>
				</Dialog>
			) : (
				<Drawer open={isEditing} onOpenChange={setIsEditing}>
					<DrawerTrigger
						onClick={() => setIsEditing(true)}
						className="border-surface-300-700 flex w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 md:hidden"
					>
						<div className="flex w-full flex-col gap-1 text-left">
							<span className="text-surface-600-400 text-xs">Name</span>
							<span className="text-surface-800-200 font-medium">{user.name}</span>
						</div>
						<div className="btn-icon preset-faded-surface-50-950">
							{' '}
							<Pencil size={16} color="currentColor" />
						</div>
					</DrawerTrigger>
					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Edit name</DrawerTitle>
						</DrawerHeader>
						{form}
					</DrawerContent>
				</Drawer>
			)}

			{successMessage && <p className="text-success-600-400 mt-2">{successMessage}</p>}
			{errorMessage && <p className="text-error-600-400 mt-2">{errorMessage}</p>}
		</div>
	);
}
