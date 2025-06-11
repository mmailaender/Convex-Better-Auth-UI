// React
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/** UI **/
// Icons
import { LogIn, Pencil } from 'lucide-react';
// Primitives
import { toast } from 'sonner';
import { Avatar, FileUpload } from '@skeletonlabs/skeleton-react';

// Utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';

// API
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Types
import type { Id } from '@/convex/_generated/dataModel';
import type { FileChangeDetails } from '@zag-js/file-upload';

export default function CreateOrganization({
	onSuccessfulCreate,
	redirectTo
}: {
	onSuccessfulCreate?: () => void;
	redirectTo?: string;
}) {
	const router = useRouter();
	const { isLoading, isAuthenticated } = useConvexAuth();

	const createOrganization = useMutation(api.organizations.createOrganization);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [logo, setLogo] = useState('');
	const [logoFile, setLogoFile] = useState<File | null>(null);

	const generateSlug = (input: string): string => input.toLowerCase().replace(/\s+/g, '-');

	const handleNameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		const input = event.target.value;
		setName(input);
		setSlug(generateSlug(input));
	};

	const handleFileChange = async (details: FileChangeDetails) => {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			const optimizedFile = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const previewUrl = URL.createObjectURL(optimizedFile);
			setLogo(previewUrl);
			setLogoFile(optimizedFile);
			toast.success('Logo ready for upload!');
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to process logo: ${errorMessage}`);
		}
	};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();

		if (!name || !slug) {
			toast.error('Name and slug are required');
			return;
		}

		try {
			let logoStorageId: Id<'_storage'> | undefined;

			// Upload the logo if one was selected
			if (logoFile) {
				const uploadUrl = await generateUploadUrl();
				const response = await fetch(uploadUrl, {
					method: 'POST',
					headers: { 'Content-Type': logoFile.type },
					body: logoFile
				});
				if (!response.ok) throw new Error('Failed to upload file');
				const result = await response.json();
				logoStorageId = result.storageId as Id<'_storage'>;
			}

			// Create the organization
			await createOrganization({ name, slug, logoId: logoStorageId });
			toast.success('Organization created successfully');
			// Call the onSuccessfulCreate callback if provided
			if (onSuccessfulCreate) onSuccessfulCreate();
			// Navigate to the specified URL
			if (redirectTo) router.push(redirectTo);
		} catch (err: unknown) {
			const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to create organization: ${errorMessage}`);
		}
	};

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
		<form onSubmit={handleSubmit} className="mx-auto w-full">
			<div className="my-6">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="relative cursor-pointer transition-colors hover:brightness-125 hover:dark:brightness-75">
						<Avatar
							src={logo}
							name={name.length > 0 ? name : 'My Organization'}
							background="bg-surface-400-600"
							size="size-20"
							rounded="rounded-base"
						/>
						<div className="badge-icon preset-filled-surface-300-700 border-surface-200-800 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2">
							<Pencil className="size-4" />
						</div>
					</div>
				</FileUpload>
			</div>

			<div className="flex flex-col gap-2">
				<div className="mb-4">
					<label htmlFor="name" className="label">
						Name
					</label>
					<input
						type="text"
						id="name"
						value={name}
						onChange={handleNameInput}
						required
						className="input w-full"
						placeholder="My Organization..."
					/>
				</div>
				<div className="mb-4">
					<label htmlFor="slug" className="label">
						Slug URL
					</label>
					<input
						type="text"
						id="slug"
						value={slug}
						onChange={(e) => setSlug(e.target.value)}
						required
						className="input w-full"
						placeholder="my-organization"
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2 pt-6 md:flex-row">
				<button type="submit" className="btn preset-filled-primary-500">
					Create Organization
				</button>
			</div>
		</form>
	);
}
