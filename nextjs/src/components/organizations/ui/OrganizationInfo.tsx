'use client';

import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Pencil } from 'lucide-react';
import { Avatar, FileUpload } from '@skeletonlabs/skeleton-react';
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import type { Id } from '@/convex/_generated/dataModel';
import type { FileChangeDetails } from '@zag-js/file-upload';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose
} from '@/components/primitives/ui/dialog';
import {
	Drawer,
	DrawerTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerClose
} from '@/components/primitives/ui/drawer';
import { toast } from 'sonner';
import { preloadImage } from '@/components/primitives/utils/preloadImage';

export default function OrganizationInfo() {
	/* ───────────────────────────────────────────── state & queries ── */
	const user = useQuery(api.users.getUser);
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	const updateOrganization = useMutation(api.organizations.updateOrganizationProfile);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [success, setSuccess] = useState('');
	const [error, setError] = useState('');
	const [isUploading, setIsUploading] = useState(false);
	const [manualSlugEdit, setManualSlugEdit] = useState(false);

	const [formState, setFormState] = useState({ name: '', slug: '' });

	const [orgData, setOrgData] = useState({
		organizationId: '' as Id<'organizations'>,
		name: '',
		slug: '',
		logo: '',
		logoId: '' as Id<'_storage'> | undefined
	});

	/** Single source of truth for what the UI shows; never undefined */
	const [logoSrc, setLogoSrc] = useState<string>(activeOrganization?.logo ?? '');

	/* stable ref with whatever is currently shown */
	const shownLogoRef = useRef(logoSrc);
	useEffect(() => {
		shownLogoRef.current = logoSrc;
	}, [logoSrc]);

	/* handle new logo from Convex only after it is pre-loaded */
	useEffect(() => {
		if (!activeOrganization) return;
		if (!activeOrganization.logo || activeOrganization.logo === shownLogoRef.current) {
			// just keep org data in sync
			setOrgData({
				organizationId: activeOrganization._id,
				name: activeOrganization.name,
				slug: activeOrganization.slug || '',
				logo: activeOrganization.logo || '',
				logoId: activeOrganization.logoId
			});
			setFormState({
				name: activeOrganization.name,
				slug: activeOrganization.slug || ''
			});
			return;
		}

		let revoked: string | undefined;

		preloadImage(activeOrganization.logo)
			.then(() => {
				if (shownLogoRef.current.startsWith('blob:')) revoked = shownLogoRef.current;
				setLogoSrc(activeOrganization.logo!);
			})
			.catch(() => void 0);

		return () => {
			if (revoked) URL.revokeObjectURL(revoked);
		};
	}, [activeOrganization]);

	// tidy up any leftover blob on unmount
	useEffect(() => {
		return () => {
			if (logoSrc.startsWith('blob:')) URL.revokeObjectURL(logoSrc);
		};
	}, [logoSrc]);

	/* auto-generate slug unless the user touched it */
	useEffect(() => {
		if (!manualSlugEdit) {
			const formatted = formState.name
				.toLowerCase()
				.trim()
				.replace(/[^a-z0-9]+/g, '-')
				.replace(/^-+|-+$/g, '');
			setFormState((p) => ({ ...p, slug: formatted }));
		}
	}, [formState.name, manualSlugEdit]);

	if (!user || !activeOrganization) return null;

	/* ───────────────────────────────────────────── handlers ────────── */
	const toggleEdit = () => {
		if (!isOwnerOrAdmin) return;
		setIsDialogOpen(true);
		setIsDrawerOpen(true);
		setSuccess('');
		setError('');
		setManualSlugEdit(false);
	};

	const cancelEdit = () => {
		setIsDialogOpen(false);
		setIsDrawerOpen(false);
		setSuccess('');
		setError('');
		setFormState({ name: orgData.name, slug: orgData.slug });
		setManualSlugEdit(false);
	};

	const handleFileChange = async (details: FileChangeDetails) => {
		const file = details.acceptedFiles.at(0);
		if (!file) return;

		try {
			setError('');
			setSuccess('');
			setIsUploading(true);

			const optimised = await optimizeImage(file, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});

			const newLogoUrl = URL.createObjectURL(optimised);

			// clean up prior blob
			if (logoSrc.startsWith('blob:')) URL.revokeObjectURL(logoSrc);

			/* optimistic UI swap */
			setLogoSrc(newLogoUrl);

			const uploadUrl = await generateUploadUrl();
			const res = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimised.type },
				body: optimised
			});
			if (!res.ok) throw new Error('Failed to upload file');

			const { storageId } = await res.json();
			const logoStorageId = storageId as Id<'_storage'>;

			await updateOrganization({
				organizationId: orgData.organizationId,
				name: orgData.name,
				slug: orgData.slug,
				logoId: logoStorageId
			});

			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			setError(`Failed to update logo: ${message}`);

			// revert to server image
			setLogoSrc(activeOrganization.logo || '');
		} finally {
			setIsUploading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			setIsUploading(true);
			setSuccess('');
			setError('');

			await updateOrganization({
				organizationId: orgData.organizationId,
				name: formState.name,
				slug: formState.slug
			});

			setOrgData((p) => ({ ...p, name: formState.name, slug: formState.slug }));
			setIsDialogOpen(false);
			setIsDrawerOpen(false);
			toast.success('Organization details updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			setError(`Failed to update organization: ${message}`);
		} finally {
			setIsUploading(false);
		}
	};

	/* ───────────────────────────────────────────── view ────────────── */
	const form = (
		<form onSubmit={handleSubmit} className="w-full">
			<div className="flex flex-col gap-4">
				<div>
					<label htmlFor="name" className="label">
						Organization Name
					</label>
					<input
						type="text"
						name="name"
						className="input"
						value={formState.name}
						onChange={(e) => setFormState({ ...formState, name: e.target.value })}
						required
					/>
				</div>

				<div>
					<label htmlFor="slug" className="label">
						Slug URL
					</label>
					<input
						type="text"
						name="slug"
						className="input"
						value={formState.slug}
						onChange={(e) => {
							setManualSlugEdit(true);
							setFormState({ ...formState, slug: e.target.value });
						}}
					/>
				</div>

				<DialogFooter>
					<button type="button" className="btn preset-tonal w-full md:w-fit" onClick={cancelEdit}>
						Cancel
					</button>
					<button
						type="submit"
						className="btn preset-filled-primary-500 w-full md:w-fit"
						disabled={isUploading}
					>
						Save
					</button>
				</DialogFooter>
			</div>
		</form>
	);

	return (
		<div className="h-full">
			<h6 className="border-surface-300-700 text-surface-700-300 border-b pb-6 text-center text-sm font-medium md:text-left">
				General settings
			</h6>

			<div className="flex flex-col items-start gap-6 pt-6">
				<FileUpload accept="image/*" allowDrop maxFiles={1} onFileChange={handleFileChange}>
					<div className="group relative ml-1 flex cursor-pointer flex-col items-center justify-center gap-2">
						<div key={logoSrc} className="fade-img">
							<Avatar
								src={logoSrc}
								name={orgData.name || 'Organization'}
								size="size-20 rounded-xl"
							/>
						</div>

						<div className="btn-icon preset-filled-surface-300-700 border-surface-100-900 absolute -right-1.5 -bottom-1.5 size-3 rounded-full border-2">
							<Pencil size={16} color="currentColor" />
						</div>
					</div>
				</FileUpload>

				{/* Desktop Dialog - hidden on mobile, shown on desktop */}
				<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
					<DialogTrigger
						className="border-surface-300-700 hover:bg-surface-50-950 hover:border-surface-50-950 hidden w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 duration-300 ease-in-out md:flex"
						onClick={toggleEdit}
					>
						<div className="flex w-full flex-col gap-1 text-left">
							<span className="text-surface-600-400 text-xs">Organization name</span>
							<span className="text-surface-800-200 font-medium">{orgData.name}</span>
						</div>
						<div className="btn preset-filled-surface-200-800 p-2">
							<Pencil size={16} color="currentColor" />
						</div>
					</DialogTrigger>

					<DialogContent className="md:max-w-108">
						<DialogHeader>
							<DialogTitle>Edit Organization</DialogTitle>
						</DialogHeader>
						{form}
						<DialogClose />
					</DialogContent>
				</Dialog>

				{/* Mobile Drawer - shown on mobile, hidden on desktop */}
				<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
					<DrawerTrigger
						onClick={toggleEdit}
						className="border-surface-300-700 flex w-full flex-row content-center items-center rounded-xl border py-2 pr-3 pl-4 md:hidden"
					>
						<div className="flex w-full flex-col gap-1 text-left">
							<span className="text-surface-600-400 text-xs">Organization name</span>
							<span className="text-surface-800-200 font-medium">{orgData.name}</span>
						</div>
						<div className="btn-icon preset-filled-surface-200-800">
							<Pencil size={16} color="currentColor" />
						</div>
					</DrawerTrigger>

					<DrawerContent>
						<DrawerHeader>
							<DrawerTitle>Edit Organization</DrawerTitle>
						</DrawerHeader>
						{form}
						<DrawerClose />
					</DrawerContent>
				</Drawer>
			</div>

			{success && <p className="text-error-600-400 mt-2">{success}</p>}
			{error && <p className="text-error-600-400 mt-2">{error}</p>}
		</div>
	);
}
