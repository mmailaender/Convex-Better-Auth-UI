'use client';

// React
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** UI **/
// Icons
import { LogIn, Pencil, Building2 } from 'lucide-react';
// Primitives
import * as Avatar from '@/components/primitives/ui/avatar';
import * as ImageCropper from '@/components/primitives/ui/image-cropper';
import { toast } from 'sonner';

// Utils
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';

// API
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../../../lib/auth/api/auth-client';

// Types
import type { Id } from '@/convex/_generated/dataModel';

export default function CreateOrganization({
	onSuccessfulCreate,
	redirectTo
}: {
	onSuccessfulCreate?: () => void;
	redirectTo?: string;
}) {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { isLoading, isAuthenticated } = useConvexAuth();

	const createOrganization = useMutation(api.organizations.mutations.createOrganization);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

	// Query for active organization
	const { data: activeOrganization, refetch: refetchActiveOrganization } =
		authClient.useActiveOrganization();

	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [logo, setLogo] = useState<string | undefined>();
	const [logoFile, setLogoFile] = useState<File | null>(null);
	const [cropSrc, setCropSrc] = useState('');

	useEffect(() => {
		return () => {
			if (logo?.startsWith('blob:')) {
				URL.revokeObjectURL(logo);
			}
		};
	}, [logo]);

	const generateSlug = (input: string): string => input.toLowerCase().replace(/\s+/g, '-');

	const handleNameInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		const input = event.target.value;
		setName(input);
		setSlug(generateSlug(input));
	};

	const handleCropped = async (url: string) => {
		try {
			const croppedFile = await ImageCropper.getFileFromUrl(url, 'logo.png');
			const optimizedFile = await optimizeImage(croppedFile, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			if (logo?.startsWith('blob:')) {
				URL.revokeObjectURL(logo);
			}
			const previewUrl = URL.createObjectURL(optimizedFile);
			setLogo(previewUrl);
			setLogoFile(optimizedFile);
			setCropSrc(previewUrl);
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

			const currentUrl = new URL(window.location.href);
			const pathSegments = currentUrl.pathname.split('/');
			const activeOrgSlug = activeOrganization?.slug;

			// Create the organization
			await createOrganization({ name, slug, logoId: logoStorageId });
			await refetchActiveOrganization();
			toast.success('Organization created successfully!');

			// Call the onSuccessfulCreate callback if provided
			if (onSuccessfulCreate) onSuccessfulCreate();

			// Redirect
			const redirectUrl = redirectTo ?? searchParams.get('redirectTo');

			// Navigate to the specified URL
			if (redirectUrl) {
				router.push(redirectUrl);
			} else {
				let needsRedirect = false;
				if (activeOrgSlug) {
					// Check each path segment for the organization ID
					for (let i = 0; i < pathSegments.length; i++) {
						if (pathSegments[i] === activeOrgSlug) {
							// Found the organization ID in the URL path
							pathSegments[i] = activeOrganization?.slug;
							needsRedirect = true;
							break;
						}
					}
				}

				if (needsRedirect) {
					// Reconstruct the URL with the new organization ID
					currentUrl.pathname = pathSegments.join('/');
					router.push(currentUrl.pathname + currentUrl.search);
				}
			}
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
			<div className="border-surface-200-800 rounded-container mx-auto h-45 w-full max-w-md border p-6 text-center">
				<LogIn className="text-surface-400-600 mx-auto mb-4 size-10" />
				<h2 className="mb-2 text-xl font-semibold">Authentication Required</h2>
				<p className="text-surface-600-400 mb-4">Please sign in to create an organization</p>
			</div>
		);
	}

	return (
		<form onSubmit={handleSubmit} className="mx-auto w-full max-w-md">
			<div className="my-6">
				<ImageCropper.Root
					src={cropSrc}
					onSrcChange={setCropSrc}
					accept="image/*"
					onCropped={handleCropped}
				>
					<ImageCropper.UploadTrigger>
						<div className="rounded-container relative size-20 cursor-pointer transition-all duration-200">
							<Avatar.Root className="rounded-container size-20">
								<Avatar.Image src={logo} alt={name.length > 0 ? name : 'My Organization'} />
								<Avatar.Fallback className="bg-surface-300-700 hover:bg-surface-400-600/80 rounded-container duration-150 ease-in-out">
									<Building2 className="text-surface-700-300 size-10" />
								</Avatar.Fallback>
							</Avatar.Root>
							<div className="badge-icon preset-filled-surface-300-700 ring-surface-50-950 dark:ring-surface-100-900 absolute -right-1.5 -bottom-1.5 size-3 rounded-full ring-4">
								<Pencil className="size-4" />
							</div>
						</div>
					</ImageCropper.UploadTrigger>
					<ImageCropper.Dialog>
						<ImageCropper.Cropper cropShape="rect" />
						<ImageCropper.Controls>
							<ImageCropper.Cancel />
							<ImageCropper.Crop>Upload</ImageCropper.Crop>
						</ImageCropper.Controls>
					</ImageCropper.Dialog>
				</ImageCropper.Root>
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
