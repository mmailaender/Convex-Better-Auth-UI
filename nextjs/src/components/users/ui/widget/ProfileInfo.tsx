import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import { UploadCloud } from 'lucide-react';
import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-react';

import type { Id } from '@/convex/_generated/dataModel';
import { type FileChangeDetails } from '@zag-js/file-upload';

export default function ProfileInfo() {
	// Get user data from Convex
	const user = useQuery(api.users.getUser);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateUserName = useMutation(api.users.updateUserName);
	const updateAvatar = useMutation(api.users.updateAvatar);

	// Component state
	const [isEditing, setIsEditing] = useState<boolean>(false);
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [name, setName] = useState<string>('');

	if (user && name === '') {
		setName(user.name);
	}

	// Handle toggling edit mode
	const toggleEdit = (): void => {
		setIsEditing(true);
		setSuccessMessage('');
		setErrorMessage('');
	};

	// Handle canceling edit
	const cancelEdit = (): void => {
		setIsEditing(false);
		setSuccessMessage('');
		setErrorMessage('');
	};

	// Handle form submission to update profile
	const handleSubmit = async (event: React.FormEvent): Promise<void> => {
		event.preventDefault();

		try {
			await updateUserName({
				name
			});

			setIsEditing(false);
			setSuccessMessage('Profile updated successfully!');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setErrorMessage(`Failed to update profile: ${errorMessage}`);
		}
	};

	// Handle file upload for avatar
	const handleFileChange = async (details: FileChangeDetails): Promise<void> => {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			setIsUploading(true);
			setErrorMessage('');
			setSuccessMessage('');

			// Optimize the image before upload
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true // Always convert to WebP
			});

			// Get a storage upload URL from Convex
			const uploadUrl = await generateUploadUrl();

			// Upload the file to Convex storage
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: {
					'Content-Type': optimizedFile.type
				},
				body: optimizedFile
			});

			if (!response.ok) {
				throw new Error('Failed to upload file');
			}

			// Get the storage ID from the response
			const result = await response.json();
			const storageId = result.storageId as Id<'_storage'>;

			// Update the user's avatar with the storage ID
			await updateAvatar({
				storageId
			});

			setSuccessMessage('Avatar updated successfully!');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setErrorMessage(`Failed to upload avatar: ${errorMessage}`);
		} finally {
			setIsUploading(false);
		}
	};

	// Return loading state if user data is not yet available
	if (!user) {
		return <div className="h-16 w-full animate-pulse rounded-md bg-gray-200"></div>;
	}

	return (
		<div>
			<div className="flex flex-col items-center gap-1">
				<p className="w-full py-2 pl-4 font-semibold">Profile</p>
				<div className="bg-surface-50-950 flex w-full items-center justify-center rounded-lg p-0 py-4">
					<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
						<div className="group relative flex cursor-pointer flex-col gap-2">
							<Avatar src={user.image || ''} name={user.name} size="size-20" />

							<span className="text-surface-950-50 text-center text-sm font-semibold hover:underline">
								Upload
							</span>

							{/* <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <UploadCloud className="size-6 text-white" />
              </div> */}
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

				{!isEditing ? (
					<button
						onClick={toggleEdit}
						className="bg-surface-50-950 flex w-full flex-col items-start rounded-lg px-4 py-2"
					>
						<span className="text-surface-600-400 text-xs">Name</span>
						<span className="text-surface-800-200 font-medium">{user.name}</span>
					</button>
				) : (
					<form onSubmit={handleSubmit} className="w-full">
						<div className="flex flex-col gap-2">
							<div className="flex gap-2">
								<input
									type="text"
									className="input"
									value={name}
									onChange={(e) => setName(e.target.value)}
								/>
							</div>
							<div className="flex gap-2">
								<button type="submit" className="btn preset-filled-primary-500">
									Save
								</button>
								<button type="button" className="btn preset-tonal" onClick={cancelEdit}>
									Cancel
								</button>
							</div>
						</div>
					</form>
				)}
			</div>

			{successMessage && <p className="text-success-600-400 mt-2">{successMessage}</p>}
			{errorMessage && <p className="text-error-600-400 mt-2">{errorMessage}</p>}
		</div>
	);
}
