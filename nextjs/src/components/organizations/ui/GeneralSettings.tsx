'use client';

import { FormEvent, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useConvexAuth, useMutation } from 'convex/react';
import { ConvexError, GenericId } from 'convex/values';
import { Building2, Pencil } from 'lucide-react';
import { toast } from 'sonner';

import * as Avatar from '@/components/primitives/ui/avatar';
import * as ImageCropper from '@/components/primitives/ui/image-cropper';
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import { api } from '@/convex/_generated/api';
import { useRoles } from '@/components/organizations/api/hooks';
import { useActiveOrganizationData, useActiveUserData } from '@/lib/auth/hooks';

/**
 * The last answer held through a lookup that failed or still loads (`undefined`); `null`, a
 * confirmed absence, and a signed-out session drop it.
 */
function useHeldAnswer<T>(live: T | null | undefined, signedIn: boolean): T | undefined {
	const [held, setHeld] = useState<T | undefined>(undefined);
	const current = !signedIn ? undefined : live === undefined ? held : (live ?? undefined);
	if (current !== held) setHeld(current);
	return current;
}

type SwitchFocusTarget = 'logo' | 'name' | 'slug';

export default function GeneralSettings() {
	const router = useRouter();
	const pathname = usePathname();
	const { isAuthenticated } = useConvexAuth();
	/* Both queries answer null only for an absence that lasts: the session or the user is gone,
	   the user has no active organization, or is no longer its member. A lookup that fails reads
	   as undefined, like one still loading. Holding the last answer through those keeps the form
	   mounted with a name being typed and its focus; null drops it, which closes any edit open on
	   it. Another organization's answer replaces the held one. */
	const user = useHeldAnswer(useActiveUserData(), isAuthenticated);
	const activeOrganization = useHeldAnswer(useActiveOrganizationData(), isAuthenticated);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateOrganization = useMutation(
		api.organizations.mutations.updateOrganizationProfile
	).withOptimisticUpdate((localStore, args) => {
		if (args.name === undefined) return;

		const name = args.name.trim();
		const activeOrganization = localStore.getQuery(
			api.organizations.queries.getActiveOrganization,
			{}
		);
		if (!activeOrganization) return;

		localStore.setQuery(
			api.organizations.queries.getActiveOrganization,
			{},
			{
				...activeOrganization,
				name
			}
		);

		const organizations = localStore.getQuery(api.organizations.queries.listOrganizations, {});
		if (organizations !== undefined) {
			localStore.setQuery(
				api.organizations.queries.listOrganizations,
				{},
				organizations.map((organization) =>
					organization.id === activeOrganization.id ? { ...organization, name } : organization
				)
			);
		}
	});
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;

	const [imageLoadingStatus, setImageLoadingStatus] = useState<'loading' | 'loaded' | 'error'>(
		'loaded'
	);
	const [uploadingFor, setUploadingFor] = useState<string | null>(null);
	const [logoKey] = useState(0);
	const [cropSrc, setCropSrc] = useState('');
	const [isEditingName, setIsEditingName] = useState(false);
	const [name, setName] = useState('');
	const [isEditingSlug, setIsEditingSlug] = useState(false);
	const [slug, setSlug] = useState('');
	const [isSavingSlug, setIsSavingSlug] = useState(false);
	const nameInputRef = useRef<HTMLInputElement | null>(null);
	const slugInputRef = useRef<HTMLInputElement | null>(null);

	// Where focus goes, and what is announced, when another organization closes an edit
	const rootRef = useRef<HTMLDivElement | null>(null);
	const logoTriggerRef = useRef<HTMLLabelElement | null>(null);
	const nameEditButtonRef = useRef<HTMLButtonElement | null>(null);
	const slugEditButtonRef = useRef<HTMLButtonElement | null>(null);
	const lastFocusedRef = useRef<Element | null>(null);
	const [organizationChange, setOrganizationChange] = useState('');
	const [focusAfterSwitch, setFocusAfterSwitch] = useState<SwitchFocusTarget | null>(null);

	// The organization the settings show, for work that finishes after another one is active
	const shownOrganizationIdRef = useRef<string | undefined>(undefined);
	const activeOrganizationId = activeOrganization?.id;

	useEffect(() => {
		// The crop dialog, keyed by the organization, is gone by the time a switch is seen
		const onFocusIn = (event: FocusEvent) => {
			lastFocusedRef.current = event.target as Element | null;
		};
		document.addEventListener('focusin', onFocusIn);
		return () => document.removeEventListener('focusin', onFocusIn);
	}, []);

	/* Another organization is active: an edit in progress belonged to the one before. It closes,
	   and so does the crop dialog (keyed by the organization); focus in either moves to its
	   control in the settings, and the change is announced. Before paint, while the name and slug
	   forms still hold their focus. */
	useLayoutEffect(() => {
		const previous = shownOrganizationIdRef.current;
		shownOrganizationIdRef.current = activeOrganizationId;
		if (!activeOrganizationId) {
			// signed out, or the organization is gone: no edit stays open for it
			setIsEditingName(false);
			setIsEditingSlug(false);
			return;
		}
		if (previous === undefined || previous === activeOrganizationId) return;

		const focused = document.activeElement;
		const lastFocused = lastFocusedRef.current;
		const fromCrop =
			!!lastFocused &&
			!lastFocused.isConnected &&
			!!lastFocused.closest('[role="dialog"]') &&
			(focused === null || focused === document.body);
		const fromName = isEditingName && !!nameInputRef.current?.form?.contains(focused);
		const fromSlug = isEditingSlug && !!slugInputRef.current?.form?.contains(focused);
		setCropSrc('');
		if (!isEditingName && !isEditingSlug && !fromCrop) return;
		setIsEditingName(false);
		setIsEditingSlug(false);
		setOrganizationChange(
			`The active organization changed to ${activeOrganization?.name ?? ''}. Your edit was closed.`
		);
		if (fromCrop) setFocusAfterSwitch('logo');
		else if (fromName) setFocusAfterSwitch('name');
		else if (fromSlug) setFocusAfterSwitch('slug');
		// the edit closes on the organization before: its values give way to this one's below
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [activeOrganizationId]);

	useEffect(() => {
		if (!focusAfterSwitch) return;
		// without the edit right in the new organization, focus stays in the settings
		const control = {
			logo: logoTriggerRef.current,
			name: nameEditButtonRef.current,
			slug: slugEditButtonRef.current
		}[focusAfterSwitch];
		(control ?? rootRef.current)?.focus();
		setFocusAfterSwitch(null);
	}, [focusAfterSwitch]);

	useEffect(() => {
		if (activeOrganization) {
			if (!isEditingName) setName(activeOrganization.name);
			if (!isEditingSlug) setSlug(activeOrganization.slug || '');
		}
	}, [activeOrganization, isEditingName, isEditingSlug]);

	useEffect(() => {
		if (activeOrganization?.logo && !cropSrc.startsWith('blob:')) {
			setCropSrc(activeOrganization.logo);
		}
	}, [activeOrganization?.logo, cropSrc]);

	/** Each crop carries the organization its cropper was opened on, never one shown later. */
	async function handleCropped(url: string, organizationId: string, previousLogo: string) {
		const stillShown = () => shownOrganizationIdRef.current === organizationId;
		// a crop for an organization no longer shown is dropped: its dialog closed on the switch
		if (!stillShown()) return;
		try {
			setCropSrc(url);
			setUploadingFor(organizationId);
			const croppedFile = await ImageCropper.getFileFromUrl(url, 'logo.png');
			const optimizedFile = await optimizeImage(croppedFile, {
				maxWidth: 512,
				maxHeight: 512,
				maxSizeKB: 500,
				quality: 0.85,
				format: 'webp',
				forceConvert: true
			});
			const uploadUrl = await generateUploadUrl({});
			const response = await fetch(uploadUrl, {
				method: 'POST',
				headers: { 'Content-Type': optimizedFile.type },
				body: optimizedFile
			});
			if (!response.ok) throw new Error('Failed to upload file');
			const { storageId } = (await response.json()) as { storageId: GenericId<'_storage'> };
			await updateOrganization({ logoId: storageId });
			if (stillShown()) setImageLoadingStatus('loaded');
			toast.success('Organization logo updated successfully');
		} catch (err) {
			const message = err instanceof Error ? err.message : 'An unknown error occurred';
			toast.error(`Failed to update logo: ${message}`);
			if (stillShown()) {
				setCropSrc(previousLogo);
				setImageLoadingStatus('error');
			}
		} finally {
			setUploadingFor((current) => (current === organizationId ? null : current));
		}
	}

	async function handleNameSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!activeOrganization) return;

		const trimmed = name.trim();

		try {
			if (!trimmed || trimmed === activeOrganization.name.trim()) {
				setIsEditingName(false);
				return;
			}
			setName(trimmed);
			setIsEditingName(false);
			await updateOrganization({ name: trimmed });
			toast.success('Organization name updated successfully');
		} catch (err) {
			const message =
				err instanceof ConvexError
					? err.data
					: err instanceof Error
						? err.message
						: 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		}
	}

	async function handleSlugSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!activeOrganization || isSavingSlug) return;

		try {
			const trimmed = slug.trim();
			const currentSlug = activeOrganization.slug || '';
			if (trimmed === '' || trimmed === currentSlug) {
				setIsEditingSlug(false);
				return;
			}
			setIsSavingSlug(true);
			await updateOrganization({ slug: trimmed });
			if (
				currentSlug &&
				(pathname.includes(`/${currentSlug}/`) || pathname.endsWith(`/${currentSlug}`))
			) {
				router.replace(pathname.replace(new RegExp(`/${currentSlug}(?=/|$)`, 'g'), `/${trimmed}`));
			}
			setIsEditingSlug(false);
			toast.success('Organization slug updated successfully');
		} catch (err) {
			const message =
				err instanceof ConvexError
					? err.data
					: err instanceof Error
						? err.message
						: 'An unknown error occurred';
			toast.error(`Failed to update organization: ${message}`);
		} finally {
			setIsSavingSlug(false);
		}
	}

	if (!user || !activeOrganization) return null;
	const displayedLogoSrc = cropSrc || activeOrganization.logo || undefined;
	const croppedOrganizationId = activeOrganization.id;
	const croppedPreviousLogo = activeOrganization.logo ?? '';
	const showLogoOverlay =
		!cropSrc.startsWith('blob:') &&
		(uploadingFor === activeOrganization.id || imageLoadingStatus === 'loading');

	return (
		<div ref={rootRef} tabIndex={-1} className="flex w-full flex-col items-start gap-6">
			<p className="sr-only" role="status">
				{organizationChange}
			</p>
			{/* a crop belongs to the organization it was opened on: another one closes it */}
			<ImageCropper.Root
				key={activeOrganization.id}
				src={cropSrc}
				onSrcChange={setCropSrc}
				accept="image/*"
				onCropped={(url) => handleCropped(url, croppedOrganizationId, croppedPreviousLogo)}
			>
				<ImageCropper.UploadTrigger ref={logoTriggerRef}>
					<div className="rounded-container relative cursor-pointer transition-all duration-200">
						<Avatar.Root
							key={logoKey}
							className="rounded-container size-20"
							onStatusChange={(details) => setImageLoadingStatus(details.status)}
						>
							<Avatar.Image
								src={displayedLogoSrc}
								alt={activeOrganization.name || 'Organization'}
							/>
							<Avatar.Fallback className="bg-surface-300-700 hover:bg-surface-400-600/80 rounded-container duration-150 ease-in-out">
								<Building2 className="text-surface-700-300 size-10" />
							</Avatar.Fallback>
						</Avatar.Root>
						{showLogoOverlay ? (
							<div className="bg-surface-50-950 rounded-container pointer-events-none absolute inset-0 flex items-center justify-center">
								<div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-b-transparent" />
							</div>
						) : null}
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

			<div className="flex w-full flex-col gap-3">
				<InlineEditableField
					label="Organization name"
					value={activeOrganization.name}
					editValue={name}
					setEditValue={setName}
					isEditing={isEditingName}
					setIsEditing={setIsEditingName}
					canEdit={isOwnerOrAdmin}
					inputRef={nameInputRef}
					editButtonRef={nameEditButtonRef}
					onSubmit={handleNameSubmit}
					ariaLabel="Edit organization name"
				/>
				<InlineEditableField
					label="Slug"
					value={activeOrganization.slug || ''}
					editValue={slug}
					setEditValue={setSlug}
					isEditing={isEditingSlug}
					setIsEditing={setIsEditingSlug}
					canEdit={isOwnerOrAdmin}
					inputRef={slugInputRef}
					editButtonRef={slugEditButtonRef}
					onSubmit={handleSlugSubmit}
					ariaLabel="Edit organization slug"
					isSubmitting={isSavingSlug}
				/>
			</div>
		</div>
	);
}

function InlineEditableField({
	label,
	value,
	editValue,
	setEditValue,
	isEditing,
	setIsEditing,
	canEdit,
	inputRef,
	editButtonRef,
	onSubmit,
	ariaLabel,
	isSubmitting = false
}: {
	label: string;
	value: string;
	editValue: string;
	setEditValue: (value: string) => void;
	isEditing: boolean;
	setIsEditing: (value: boolean) => void;
	canEdit: boolean;
	inputRef: React.RefObject<HTMLInputElement | null>;
	editButtonRef: React.RefObject<HTMLButtonElement | null>;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
	ariaLabel: string;
	isSubmitting?: boolean;
}) {
	return (
		<div
			className={[
				'border-surface-300-700 rounded-container relative w-full border px-3.5 py-2 transition-all duration-200 ease-in-out',
				canEdit && !isEditing
					? 'hover:bg-surface-200-800 hover:border-surface-200-800 cursor-pointer'
					: ''
			].join(' ')}
		>
			<div className="flex items-center justify-between gap-3 transition-all duration-200 ease-in-out">
				<div className="flex w-full flex-col gap-0">
					<span className="text-surface-600-400 text-xs">{label}</span>
					<div
						className={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditing ? 'grid-rows-[0fr]' : 'grid-rows-[1fr]',
							!isEditing ? 'mt-1' : ''
						].join(' ')}
						aria-hidden={isEditing}
						inert={isEditing}
					>
						<div className="overflow-hidden">
							<span className="truncate text-sm">{value}</span>
						</div>
					</div>
					<div
						className={[
							'grid transition-[grid-template-rows] duration-200 ease-in-out',
							isEditing ? 'mt-1 grid-rows-[1fr]' : 'grid-rows-[0fr]'
						].join(' ')}
						aria-hidden={!isEditing}
						inert={!isEditing}
					>
						<div className="overflow-hidden">
							<form onSubmit={onSubmit} className="flex w-full flex-col gap-3">
								<input
									ref={inputRef}
									type="text"
									className="input w-full"
									value={editValue}
									onChange={(event) => setEditValue(event.currentTarget.value)}
									disabled={isSubmitting}
								/>
								<div className="mb-1 flex gap-1.5">
									<button
										type="button"
										className="btn btn-sm preset-tonal w-full"
										disabled={isSubmitting}
										onClick={() => {
											setEditValue(value);
											setIsEditing(false);
										}}
									>
										Cancel
									</button>
									<button
										type="submit"
										className="btn btn-sm preset-filled-primary-500 w-full"
										disabled={
											isSubmitting ||
											!editValue ||
											editValue.trim() === '' ||
											editValue.trim() === value.trim()
										}
									>
										{isSubmitting ? 'Saving...' : 'Save'}
									</button>
								</div>
							</form>
						</div>
					</div>
				</div>
				{canEdit && !isEditing ? (
					<>
						<div className="shrink-0">
							<span className="btn-icon preset-filled-surface-50-950 pointer-events-none p-2">
								<Pencil className="size-4" />
							</span>
						</div>
						<button
							ref={editButtonRef}
							className="absolute inset-0 h-full w-full"
							aria-label={ariaLabel}
							type="button"
							onClick={() => {
								setIsEditing(true);
								setEditValue(value);
								requestAnimationFrame(() => {
									inputRef.current?.focus();
									inputRef.current?.select();
								});
							}}
						/>
					</>
				) : null}
			</div>
		</div>
	);
}
