import { useState, useEffect } from 'react';

// API
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Pencil } from 'lucide-react';

// Utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerFooter,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger
} from '@/components/primitives/ui/drawer';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
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

	if (!user) return <div className="h-16 w-full animate-pulse rounded-md bg-success-200-800"></div>;

	const form = (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex flex-col">
				<div className='flex flex-col gap-1 pt-2 pb-4 px-4'>
				<label className="label text-xs font-medium">Name</label>
				<input
					type="text"
					className="input border border-surface-400-600"
					value={name}
					onChange={(e) => setName(e.target.value)}
				/>
				</div>
				<DialogFooter>
			
					<button type="button" className="btn preset-tonal " onClick={cancelEdit}>
						Cancel
					</button>
					<button type="submit" className="btn preset-filled-primary-500 w-full md:w-fit ">
						Save
					</button>
			
				</DialogFooter>
			</div>
		</form>
	);

	return (
		<div className="flex flex-col items-center gap-1">
			<div className="bg-surface-50-950 flex w-full items-center justify-center rounded-lg py-4">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="group relative flex cursor-pointer flex-col gap-2">
						<Avatar src={user.image || ''} name={user.name} size="size-16" />
						<span className="text-surface-800-200 text-center text-sm font-medium hover:underline">
							Upload
						</span>
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
						className="bg-surface-50-950 hidden w-full flex-row items-center rounded-lg pl-4 pr-3 py-2 md:flex content-center"
						onClick={() => setIsEditing(true)}
					>
						<div className='flex flex-col gap-1 w-full text-left'>
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
						</div>
						<button className='btn p-2 preset-tonal-surface'> <Pencil size={16} color='currentColor'/></button>
					</DialogTrigger>
					<DialogContent className="md:max-w-108">
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
						className="bg-surface-50-950 md:hidden w-full flex-row items-center rounded-lg pl-4 pr-2 py-2 flex content-center"
					>
						<div className='flex flex-col gap-1 w-full text-left'>
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
						</div>
						<button className='btn preset-tonal-surface'> <Pencil size={16} color='currentColor'/></button>
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
