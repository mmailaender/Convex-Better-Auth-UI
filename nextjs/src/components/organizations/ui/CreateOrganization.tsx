import { useState } from 'react';
import { useRouter } from 'next/navigation';

// Components
import { Avatar, FileUpload, ProgressRing } from '@skeletonlabs/skeleton-react';
import { UploadCloud, LogIn, Pencil } from 'lucide-react';

// API
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';

// Types
import type { Id } from '@/convex/_generated/dataModel';
import type { FileChangeDetails } from '@zag-js/file-upload';

/**
 * Component for creating a new organization with logo upload support
 * Requires authentication to access the form
 */
export default function CreateOrganization({
	onSuccessfulCreate,
	redirectTo
}: {
	/**
	 * Optional callback that will be called when an organization is successfully created
	 */
	onSuccessfulCreate?: () => void;
	/**
	 * Optional redirect URL after successful creation
	 */
	redirectTo?: string;
}) {
	const router = useRouter();
	const { isLoading, isAuthenticated } = useConvexAuth();

	// Mutations
	const createOrganization = useMutation(api.organizations.createOrganization);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

	// Component state
	const [name, setName] = useState<string>('');
	const [slug, setSlug] = useState<string>('');
	const [logo, setLogo] = useState<string>('');
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successMessage, setSuccessMessage] = useState<string>('');

	/**
	 * Generates a URL-friendly slug from the provided input string
	 */
	const generateSlug = (input: string): string => {
		return input.toLowerCase().replace(/\s+/g, '-');
	};

	/**
	 * Updates the name state and automatically generates a slug
	 */
	const handleNameInput = (event: React.ChangeEvent<HTMLInputElement>): void => {
		const input = event.target.value;
		setName(input);
		setSlug(generateSlug(input));
	};

	/**
	 * Handles file selection for organization logo but doesn't upload yet
	 */
	const handleFileChange = async (details: FileChangeDetails): Promise<void> => {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			setIsUploading(true);
			setErrorMessage('');
			setSuccessMessage('');

			// Optimize the image but don't upload yet
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true // Always convert to WebP
			});

			// Store the optimized file for later upload
			setLogoFile(optimizedFile);
			setLogo(URL.createObjectURL(optimizedFile)); // For preview
			setSuccessMessage('Logo ready for upload!');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setErrorMessage(`Failed to process logo: ${errorMessage}`);
		} finally {
			setIsUploading(false);
		}
	};

	/**
	 * Handles form submission to create a new organization
	 */
	const handleSubmit = async (event: React.FormEvent): Promise<void> => {
		event.preventDefault();

		if (!name || !slug) {
			setErrorMessage('Name and slug are required');
			return;
		}

		try {
			setIsUploading(true);
			let logoStorageId: Id<'_storage'> | undefined = undefined;

			// Upload the logo if one was selected
			if (logoFile) {
				// Get a storage upload URL from Convex
				const uploadUrl = await generateUploadUrl();

				// Upload the file to Convex storage
				const response = await fetch(uploadUrl, {
					method: 'POST',
					headers: {
						'Content-Type': logoFile.type
					},
					body: logoFile
				});

				if (!response.ok) {
					throw new Error('Failed to upload file');
				}

				// Get the storage ID from the response
				const result = await response.json();
				logoStorageId = result.storageId as Id<'_storage'>;
			}

			// Create the organization with Convex
			await createOrganization({
				name,
				slug,
				logoId: logoStorageId
			});

			setSuccessMessage('Organization created successfully!');

			// Call the onSuccessfulCreate callback if provided
			if (onSuccessfulCreate) {
				onSuccessfulCreate();
			}

			// Navigate to the home page
			if (redirectTo) {
				router.push(redirectTo);
			}
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			setErrorMessage(`Failed to create organization: ${errorMessage}`);
		} finally {
			setIsUploading(false);
		}
	};

	// Show loading state
	if (isLoading) {
		return (
			<div className="mx-auto w-full max-w-md animate-pulse">
				<div className="placeholder mb-4 h-8 w-full"></div>
				<div className="placeholder mb-4 h-40 w-full"></div>
				<div className="placeholder mb-2 h-10 w-full"></div>
				<div className="placeholder h-10 w-full"></div>
			</div>
		);
	}

	// Show message for unauthenticated users
	if (!isAuthenticated) {
		return (
			<div className="border-surface-200-800 mx-auto w-full max-w-md rounded-lg border p-6 text-center">
				<LogIn className="text-surface-400-600 mx-auto mb-4 size-10" />
				<h2 className="mb-2 text-xl font-semibold">Authentication Required</h2>
				<p className="text-surface-600-400 mb-4">Please sign in to create an organization</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto w-full p-6">
			<div className="mb-4">
				{/* <label htmlFor="logo" className="mb-1 block font-medium">
					Logo
				</label> */}
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="group  hover:bg-surface-50-950 relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl transition-colors">
						{isUploading ? (
							<ProgressRing
								value={null}
								size="size-14"
								meterStroke="stroke-primary-600-400"
								trackStroke="stroke-primary-50-950"
							/>
						) : (
							<>
								<Avatar
									src={logo}
									name={name.length > 0 ? name : 'My Organization'}
									size="size-20 rounded-xl"
								/>
									<div className="btn-icon size-3 preset-filled-surface-300-700 absolute -bottom-1.5 -right-1.5 rounded-full border-2 border-surface-200-800">
							<Pencil size={16} color="currentColor" />
						</div>
								{/* <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
									<UploadCloud className="size-6 text-white" />
								</div> */}
							</>
						)}
					</div>
				</FileUpload>
			</div>
			
			<div className='flex flex-col gap-2 py-4'>
			<div className="mb-4">
				<label htmlFor="name" className="mb-1 label text-xs font-medium">
					Name
				</label>
				<input
					type="text"
					id="name"
					value={name}
					onChange={handleNameInput}
					required
					className="input w-full border-surface-400-600 border placeholder:text-surface-400-600 hover:border-surface-500 ease-in-out duration-300"
					placeholder="My Organization"
				/>
			</div>

			<div>
				<label htmlFor="slug" className="mb-1 label text-xs font-medium">
					Slug URL
				</label>
				<input
					type="text"
					id="slug"
					value={slug}
					onChange={(e) => setSlug(e.target.value)}
					required
					className="input w-full border-surface-400-600 border"
					placeholder="my-organization"
				/>
			</div>
			</div>

			<button type="submit" className="btn preset-filled-primary-500 w-full">
				Create Organization
			</button>

			{successMessage && <p className="text-success-600-400 mt-2">{successMessage}</p>}
			{errorMessage && <p className="text-error-600-400 mt-2">{errorMessage}</p>}
		</form>
	);
}
