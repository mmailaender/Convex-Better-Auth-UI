import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';
import { del, put } from '@vercel/blob';

type UploadOptions = {
	/**
	 * Base directory path in the blob storage
	 */
	directory?: string;
	/**
	 * Maximum file size in bytes (default: 2MB)
	 */
	maxSize?: number;
	/**
	 * Allowed file types (default: all image types)
	 */
	allowedTypes?: string[];
};

export class UploadError extends Error {
	constructor(
		message: string,
		public code: 'INVALID_TYPE' | 'TOO_LARGE' | 'UNKNOWN' = 'UNKNOWN'
	) {
		super(message);
		this.name = 'UploadError';
	}
}

/**
 * Uploads a file to Vercel Blob Storage
 *
 * @param file - The file to upload
 * @param options - Upload configuration options
 * @returns The URL of the uploaded file
 * @throws {UploadError} If the file is invalid or upload fails
 */
export async function uploadFile(file: File, options?: UploadOptions): Promise<string> {
	const {
		directory = 'uploads',
		maxSize = 2 * 1024 * 1024, // 2MB default
		allowedTypes = ['image/*']
	} = options || {};

	// Validate file type
	const isAllowedType = allowedTypes.some((type) => {
		if (type.endsWith('/*')) {
			const category = type.split('/')[0];
			return file.type.startsWith(`${category}/`);
		}
		return file.type === type;
	});

	if (!isAllowedType) {
		throw new UploadError(
			`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
			'INVALID_TYPE'
		);
	}

	// Validate file size
	if (file.size > maxSize) {
		throw new UploadError(
			`File too large. Maximum size: ${maxSize / (1024 * 1024)}MB`,
			'TOO_LARGE'
		);
	}

	try {
		// Generate a unique filename
		const uniqueId = crypto.randomUUID();
		const fileExtension = file.name.split('.').pop() || 'bin';
		const pathname = `${directory}/${uniqueId}.${fileExtension}`;

		// Upload to Vercel Blob
		const blob = await put(pathname, file, {
			access: 'public',
			contentType: file.type,
			token: BLOB_READ_WRITE_TOKEN
		});

		return blob.url;
	} catch (error) {
		console.error('Upload error:', error);
		throw new UploadError(error instanceof Error ? error.message : 'Failed to upload file');
	}
}

/**
 * Upload an image file to Vercel Blob Storage
 *
 * @param file - The image file to upload
 * @param options - Upload configuration options
 * @returns The URL of the uploaded image
 */
export async function uploadImage(
	file: File,
	options?: Omit<UploadOptions, 'allowedTypes'>
): Promise<string> {
	return uploadFile(file, {
		directory: 'images',
		...options,
		allowedTypes: ['image/*']
	});
}

/**
 * Upload an avatar image to Vercel Blob Storage
 *
 * @param file - The avatar image file to upload
 * @returns The URL of the uploaded avatar
 */
export async function uploadAvatar(file: File): Promise<string> {
	return uploadImage(file, {
		directory: 'avatars',
		maxSize: 1 * 1024 * 1024 // 1MB limit for avatars
	});
}

/**
 * Deletes a blob from storage by URL
 *
 * @param url - The URL of the blob to delete
 * @returns A boolean indicating success
 */
export async function deleteBlob(url: string): Promise<boolean> {
	try {
		// Extract the pathname from the URL
		const urlObj = new URL(url);
		const pathname = urlObj.pathname.startsWith('/')
			? urlObj.pathname.substring(1) // Remove leading slash
			: urlObj.pathname;

		await del(pathname, { token: BLOB_READ_WRITE_TOKEN });
		return true;
	} catch (error) {
		console.error('Error deleting blob:', error);
		throw error;
	}
}
