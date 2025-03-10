import { optimizeImage, type OptimizeImageOptions } from './optimizeImage';
import { uploadAvatar } from './upload';

/**
 * Downloads an image from a URL and converts it to a File object
 */
export async function downloadImageAsFile(
	imageUrl: string,
	fileName: string
): Promise<File | null> {
	try {
		const response = await fetch(imageUrl);
		if (!response.ok) {
			console.error(`Failed to download image: ${response.statusText}`);
			return null;
		}

		const blob = await response.blob();
		return new File([blob], fileName, { type: blob.type });
	} catch (error) {
		console.error('Error downloading image:', error);
		return null;
	}
}

/**
 * Downloads, optimizes, and uploads an avatar from a remote URL
 *
 * @param imageUrl - The remote image URL to process
 * @param fileName - The file name to use for the downloaded image
 * @param optimizeOptions - Options for image optimization
 * @returns The URL of the processed and uploaded image, or undefined if processing failed
 */
export async function processRemoteAvatar(
	imageUrl: string,
	fileName: string,
	optimizeOptions: OptimizeImageOptions = {}
): Promise<string | undefined> {
	try {
		// Download avatar from remote URL
		console.log('Downloading avatar from remote URL:', imageUrl);
		const avatarFile = await downloadImageAsFile(imageUrl, fileName);

		if (!avatarFile) {
			console.warn('Failed to download avatar from URL');
			return undefined;
		}

		console.log('Avatar downloaded:', avatarFile.size, 'bytes');

		// Optimize the avatar with default or custom options
		const defaultOptions: OptimizeImageOptions = {
			maxWidth: 512,
			maxHeight: 512,
			maxSizeKB: 500,
			quality: 80,
			format: 'webp',
			...optimizeOptions
		};

		console.log('Optimizing avatar image');
		const optimizedAvatar = await optimizeImage(avatarFile, defaultOptions);

		console.log('Avatar optimized:', optimizedAvatar.size, 'bytes');

		// Upload to our storage
		console.log('Uploading avatar to storage');
		const avatarUrl = await uploadAvatar(optimizedAvatar);

		console.log('Avatar processed and uploaded successfully:', avatarUrl);
		return avatarUrl;
	} catch (error) {
		console.error('Error processing remote avatar:', error);
		return undefined;
	}
}
