import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';

import type { Id } from '@/convex/_generated/dataModel';
import { toast } from 'sonner';

export interface ImageUploadOptions {
	maxWidth?: number;
	maxHeight?: number;
	maxSizeKB?: number;
	quality?: number;
	format?: 'webp' | 'jpeg' | 'png';
	forceConvert?: boolean;
}

export interface UseImageUploadResult {
	/**
	 * Whether an upload is in progress
	 */
	isUploading: boolean;

	/**
	 * URL for previewing the selected image
	 */
	previewUrl: string;

	/**
	 * The selected file after optimization
	 */
	selectedFile: File | null;

	/**
	 * Reset all state values
	 */
	reset: () => void;

	/**
	 * Process and optimize a file
	 */
	processFile: (file: File) => Promise<File>;

	/**
	 * Upload a file to Convex storage
	 */
	uploadFile: (file: File) => Promise<Id<'_storage'> | undefined>;

	/**
	 * Set a new preview URL
	 */
	setPreviewUrl: (url: string) => void;
}

/**
 * Hook for handling image uploads with optimization
 */
export function useImageUpload(
	initialPreviewUrl: string = '',
	options: ImageUploadOptions = {
		maxWidth: 512,
		maxHeight: 512,
		maxSizeKB: 500,
		quality: 0.85,
		format: 'webp',
		forceConvert: true
	}
): UseImageUploadResult {
	// Mutations
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

	// State
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [previewUrl, setPreviewUrl] = useState<string>(initialPreviewUrl);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);

	/**
	 * Resets all state values
	 */
	const reset = (): void => {
		setIsUploading(false);
		setPreviewUrl(initialPreviewUrl);
		setSelectedFile(null);
	};

	/**
	 * Processes and optimizes a file
	 */
	const processFile = async (file: File): Promise<File> => {
		try {
			setIsUploading(true);

			// Optimize the image
			const optimizedFile = await optimizeImage(file, options);

			// Update state
			setSelectedFile(optimizedFile);
			setPreviewUrl(URL.createObjectURL(optimizedFile));
			toast.success('Image processed successfully');

			return optimizedFile;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to process image: ${errorMessage}`);
			throw err;
		} finally {
			setIsUploading(false);
		}
	};

	/**
	 * Uploads a file to Convex storage
	 */
	const uploadFile = async (file: File): Promise<Id<'_storage'> | undefined> => {
		try {
			setIsUploading(true);

			// Get a storage upload URL from Convex
			const uploadUrl = await generateUploadUrl();

			// Upload the file to Convex storage
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: {
					'Content-Type': file.type
				},
				body: file
			});

			if (!response.ok) {
				throw new Error('Failed to upload file');
			}

			// Get the storage ID from the response
			const result = await response.json();
			const storageId = result.storageId as Id<'_storage'>;

			toast.success('Image uploaded successfully');
			return storageId;
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to upload image: ${errorMessage}`);
			return undefined;
		} finally {
			setIsUploading(false);
		}
	};

	return {
		isUploading,
		previewUrl,
		selectedFile,
		reset,
		processFile,
		uploadFile,
		setPreviewUrl
	};
}
