'use client';

import { useId, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import type { GenericId } from 'convex/values';
import { toast } from 'sonner';
import {
	ArrowLeft,
	Building2,
	CircleUser,
	Crown,
	EllipsisVertical,
	Loader2,
	Pencil,
	Plus,
	UserMinus
} from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as ImageCropper from '@/components/primitives/ui/image-cropper';
import * as Menu from '@/components/primitives/ui/menu';
import { Portal } from '@ark-ui/react/portal';
import { optimizeImage } from '@/components/primitives/utils/optimizeImage';
import { useActiveUserData } from '@/lib/auth/hooks';
import CopyButton from '@/components/admin/ui/CopyButton';
import OrganizationActionsMenu from '@/components/admin/ui/OrganizationActionsMenu';
import UserSelect from '@/components/admin/ui/UserSelect';
import type {
	AdminMember,
	AdminUser,
	OrganizationRole,
	PreviousOwner
} from '@/components/admin/types';

type OrganizationDetailsProps = {
	organizationId: string;
	/** Returns to the organizations table */
	onBack: () => void;
	/** Opens the profile of a user */
	onViewProfile: (userId: string) => void;
};

function formatDate(epochMs: number): string {
	return new Date(epochMs).toLocaleDateString();
}

/** A member's roles, which Better Auth stores comma-separated. */
function rolesOf(member: AdminMember): string[] {
	return member.role.split(',').map((role) => role.trim());
}

function isOwner(member: AdminMember): boolean {
	return rolesOf(member).includes('owner');
}

/** The role the role select shows: a member with several roles shows the highest. */
function roleOf(member: AdminMember): OrganizationRole {
	return rolesOf(member).includes('admin') ? 'admin' : 'member';
}

function RoleBadge({ label, owner = false }: { label: string; owner?: boolean }) {
	return (
		<span
			className={`badge border capitalize ${
				owner
					? 'preset-filled-primary-50-950 border-primary-200-800'
					: 'preset-tonal border-transparent'
			}`}
		>
			{label}
		</span>
	);
}

/** Items the menu can't run right now, like a transfer without a successor. */
const DISABLED_ITEM = 'data-[disabled]:pointer-events-none data-[disabled]:opacity-50';

/**
 * The admin dashboard's page of an organization: its profile, which admins can edit, and its
 * members, whose roles admins change inline, plus adding and removing members and handing over
 * the ownership.
 */
export default function OrganizationDetails({
	organizationId,
	onBack,
	onViewProfile
}: OrganizationDetailsProps) {
	const formId = useId();
	const activeUser = useActiveUserData();
	const activeUserId = activeUser?._id;
	const details = useQuery(api.admin.queries.getOrganizationWithMembers, { organizationId });
	const organization = details?.organization ?? null;
	const members = details?.members ?? [];

	const updateOrganization = useMutation(api.admin.mutations.updateOrganization);
	const generateUploadUrl = useMutation(api.storage.generateUploadUrl);
	const updateMemberRole = useMutation(api.admin.mutations.updateMemberRole);
	const removeMember = useMutation(api.admin.mutations.removeMember);
	const transferOwnership = useMutation(api.admin.mutations.transferOwnership);
	const addMember = useMutation(api.admin.mutations.addMember);

	/**
	 * Whether the admin can't change this membership: other admins have to lose their admin role
	 * first, like on their profile (see `assertCanManageUser`).
	 */
	function isLocked(member: AdminMember): boolean {
		return Boolean(member.user?.isAppAdmin && member.user._id !== activeUserId);
	}

	const owners = members.filter(isOwner);
	// Ownership changes the previous owner's membership too, so they mustn't be locked
	const canTransfer = !owners.some(isLocked);
	// A member whose account was deleted can be removed, but can't become the owner
	const successors = members.filter(
		(member) => member.user && !isOwner(member) && !isLocked(member)
	);
	const hasLockedMembers = members.some(isLocked);

	// Profile form. Fields the admin hasn't edited follow the organization as it changes elsewhere
	const [name, setName] = useState('');
	const [slug, setSlug] = useState('');
	const [saving, setSaving] = useState(false);
	const [loaded, setLoaded] = useState<{ id: string; name: string; slug: string } | null>(null);
	if (
		organization &&
		(organization._id !== loaded?.id ||
			organization.name !== loaded.name ||
			organization.slug !== loaded.slug)
	) {
		const otherOrganization = organization._id !== loaded?.id;
		if (otherOrganization || name === loaded?.name) setName(organization.name);
		if (otherOrganization || slug === loaded?.slug) setSlug(organization.slug);
		setLoaded({ id: organization._id, name: organization.name, slug: organization.slug });
	}
	const isDirty =
		Boolean(organization) &&
		(name.trim() !== organization?.name || slug.trim() !== organization?.slug);

	// Logo
	const [cropSrc, setCropSrc] = useState('');
	const [logoPreview, setLogoPreview] = useState<string | null>(null);
	const [logoBusy, setLogoBusy] = useState(false);

	// Dialogs
	const [transferOpen, setTransferOpen] = useState(false);
	const [successorId, setSuccessorId] = useState('');
	const [previousOwner, setPreviousOwner] = useState<PreviousOwner>('admin');
	const [transferring, setTransferring] = useState(false);

	const [addOpen, setAddOpen] = useState(false);
	const [addUser, setAddUser] = useState<AdminUser | null>(null);
	const [addRole, setAddRole] = useState<OrganizationRole>('member');
	const [adding, setAdding] = useState(false);
	const memberUserIds = members.flatMap((member) => (member.user ? [member.user._id] : []));

	async function run(action: () => Promise<unknown>, success: string, failure: string) {
		try {
			await action();
			toast.success(success);
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : failure);
			return false;
		}
	}

	async function handleSave(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!organization) return;
		setSaving(true);
		// Only the edited fields, so a change made elsewhere meanwhile isn't overwritten
		const done = await run(
			() =>
				updateOrganization({
					organizationId: organization._id,
					name: name.trim() !== organization.name ? name : undefined,
					slug: slug.trim() !== organization.slug ? slug.trim() : undefined
				}),
			'Saved the organization',
			'Failed to save the organization'
		);
		// Show what the server stored, such as the trimmed name
		if (done) setLoaded(null);
		setSaving(false);
	}

	async function handleCropped(url: string) {
		if (!organization) return;
		const { _id } = organization;
		setLogoPreview(url);
		setLogoBusy(true);
		await run(
			async () => {
				const file = await optimizeImage(await ImageCropper.getFileFromUrl(url, 'logo.png'), {
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
					headers: { 'Content-Type': file.type },
					body: file
				});
				if (!response.ok) throw new Error('Failed to upload the logo');
				const { storageId } = (await response.json()) as { storageId: GenericId<'_storage'> };
				await updateOrganization({ organizationId: _id, logoId: storageId });
			},
			'Updated the logo',
			'Failed to update the logo'
		);
		setLogoPreview(null);
		setLogoBusy(false);
	}

	async function handleRemoveLogo() {
		if (!organization) return;
		const { _id } = organization;
		setLogoBusy(true);
		await run(
			() => updateOrganization({ organizationId: _id, logoId: null }),
			'Removed the logo',
			'Failed to remove the logo'
		);
		setLogoBusy(false);
	}

	function handleRoleChange(member: AdminMember, role: OrganizationRole) {
		if (role === member.role) return;
		// Selecting what a member with several roles already shows makes that their only role
		void run(
			() => updateMemberRole({ memberId: member._id, role }),
			`${member.user?.name} is now ${role === 'admin' ? 'an admin' : 'a member'}`,
			'Failed to change the role'
		);
	}

	function handleRemove(member: AdminMember) {
		void run(
			() => removeMember({ memberId: member._id }),
			`Removed ${member.user?.name ?? 'the deleted user'} from ${organization?.name}`,
			'Failed to remove the member'
		);
	}

	/** Opens the transfer dialog, with `successor` as the new owner when given. */
	function openTransfer(successor?: AdminMember) {
		setSuccessorId(successor?._id ?? successors[0]?._id ?? '');
		setPreviousOwner('admin');
		setTransferOpen(true);
	}

	async function handleTransfer(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const successor = successors.find((member) => member._id === successorId);
		if (!successor) return;
		setTransferring(true);
		const done = await run(
			() => transferOwnership({ memberId: successor._id, previousOwner }),
			`${successor.user?.name} now owns ${organization?.name}`,
			'Failed to transfer the ownership'
		);
		setTransferring(false);
		if (done) setTransferOpen(false);
	}

	function openAdd() {
		setAddUser(null);
		setAddRole('member');
		setAddOpen(true);
	}

	async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!organization || !addUser) return;
		const user = addUser;
		setAdding(true);
		const done = await run(
			() => addMember({ userId: user.id, organizationId: organization._id, role: addRole }),
			`Added ${user.name} to ${organization.name}`,
			'Failed to add the member'
		);
		setAdding(false);
		if (done) setAddOpen(false);
	}

	return (
		<div className="flex flex-col gap-6 py-4">
			<button
				type="button"
				className="btn hover:preset-tonal w-fit gap-2 px-2 text-sm"
				onClick={onBack}
			>
				<ArrowLeft className="size-4" aria-hidden="true" />
				Organizations
			</button>

			{details === undefined ? (
				<div className="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					Loading organization...
				</div>
			) : !details || !organization ? (
				<div className="text-surface-600-400 text-sm">
					This organization doesn&apos;t exist anymore.
				</div>
			) : (
				<>
					{/* Header */}
					<header className="flex items-start gap-4">
						<Avatar.Root className="rounded-container size-16 shrink-0">
							<Avatar.Image src={organization.logo ?? undefined} alt={organization.name} />
							<Avatar.Fallback className="rounded-container">
								<Avatar.Marble name={organization.name} />
							</Avatar.Fallback>
						</Avatar.Root>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<h2 className="h4 truncate">{organization.name}</h2>
							<p className="text-surface-600-400 truncate text-sm">{organization.slug}</p>
							<div className="text-surface-600-400 flex items-center gap-1 text-xs">
								<span className="shrink-0">Organization ID</span>
								<code className="truncate">{organization._id}</code>
								<CopyButton text={organization._id} label="Copy organization ID" />
							</div>
						</div>
						<OrganizationActionsMenu organization={organization} onDeleted={onBack} />
					</header>

					{/* Profile */}
					<section className="card border-surface-300-700 flex flex-col gap-4 border p-4">
						<h3 className="h6">Profile</h3>
						<div className="flex items-center gap-4">
							<ImageCropper.Root
								src={cropSrc}
								onSrcChange={setCropSrc}
								accept="image/*"
								onCropped={handleCropped}
							>
								{/* Inert while a logo saves, so a second upload can't race the first */}
								<ImageCropper.UploadTrigger
									className="rounded-container block cursor-pointer"
									aria-label="Upload a new logo"
									aria-disabled={logoBusy}
									inert={logoBusy}
								>
									<div className="relative">
										<Avatar.Root className="rounded-container size-16">
											<Avatar.Image
												src={logoPreview ?? organization.logo ?? undefined}
												alt={organization.name}
											/>
											<Avatar.Fallback className="bg-surface-300-700 rounded-container">
												<Building2 className="text-surface-700-300 size-8" aria-hidden="true" />
											</Avatar.Fallback>
										</Avatar.Root>
										{logoBusy ? (
											<div className="bg-surface-50-950/70 rounded-container absolute inset-0 flex items-center justify-center">
												<Loader2 className="size-5 animate-spin" aria-hidden="true" />
											</div>
										) : null}
										<div className="badge-icon preset-filled-surface-300-700 ring-surface-50-950 dark:ring-surface-100-900 absolute -right-1.5 -bottom-1.5 size-3 rounded-full ring-4">
											<Pencil className="size-4" aria-hidden="true" />
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
							<div className="flex flex-col gap-1">
								<span className="text-sm">Logo</span>
								<span className="text-surface-600-400 text-xs">
									Click the logo to upload a new one.
								</span>
								{organization.logo ? (
									<button
										type="button"
										className="btn btn-sm hover:preset-tonal text-error-600-400 -ml-2 w-fit"
										onClick={handleRemoveLogo}
										disabled={logoBusy}
									>
										Remove logo
									</button>
								) : null}
							</div>
						</div>
						<form className="flex flex-col gap-3" onSubmit={handleSave}>
							<fieldset className="grid gap-3 sm:grid-cols-2" disabled={saving}>
								<label className="label">
									<span className="label-text">Name</span>
									<input
										type="text"
										className="input"
										value={name}
										onChange={(e) => setName(e.target.value)}
										autoComplete="off"
										required
									/>
								</label>
								<label className="label">
									<span className="label-text">Slug</span>
									<input
										type="text"
										className="input"
										value={slug}
										onChange={(e) => setSlug(e.target.value)}
										autoComplete="off"
										pattern="[a-z0-9\-]+"
										title="Lowercase letters, numbers and hyphens"
										required
									/>
								</label>
							</fieldset>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-surface-600-400 text-xs">
									The slug can show in URLs: links with the old slug stop working.
								</p>
								<button
									type="submit"
									className="btn preset-filled-primary-500"
									disabled={!isDirty || saving}
									aria-busy={saving}
								>
									{saving ? (
										<>
											<Loader2 className="size-4 animate-spin" aria-hidden="true" />
											Saving...
										</>
									) : (
										'Save'
									)}
								</button>
							</div>
						</form>
						<dl className="border-surface-300-700 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
							<div>
								<dt className="text-surface-600-400 text-xs">Created</dt>
								<dd>{formatDate(organization.createdAt)}</dd>
							</div>
							<div>
								<dt className="text-surface-600-400 text-xs">Owner</dt>
								<dd className="truncate">
									{owners.map((owner) => owner.user?.name ?? 'Deleted user').join(', ') || 'None'}
								</dd>
							</div>
							<div>
								<dt className="text-surface-600-400 text-xs">Members</dt>
								<dd>{members.length}</dd>
							</div>
						</dl>
					</section>

					{/* Members */}
					<section className="card border-surface-300-700 flex flex-col gap-3 border p-4">
						<div className="flex items-center justify-between gap-3">
							<h3 className="h6">Members</h3>
							<button type="button" className="btn btn-sm preset-tonal gap-2" onClick={openAdd}>
								<Plus className="size-4" aria-hidden="true" />
								Add member
							</button>
						</div>
						{hasLockedMembers ? (
							<p className="text-surface-600-400 text-xs">
								Members who are app admins keep their role and membership here until their admin
								role is removed.
							</p>
						) : null}
						{members.length === 0 ? (
							<p className="text-surface-600-400 text-sm">No members.</p>
						) : (
							<>
								<table className="table w-full">
									<thead>
										<tr>
											<th className="text-surface-600-400 p-2 !pl-0 text-left text-xs font-semibold">
												User
											</th>
											<th className="text-surface-600-400 hidden w-28 p-2 text-left text-xs md:table-cell">
												Joined
											</th>
											<th className="text-surface-600-400 w-36 p-2 text-left text-xs">Role</th>
											<th className="w-12 p-2">
												<span className="sr-only">Actions</span>
											</th>
										</tr>
									</thead>
									<tbody>
										{members.map((member) => {
											const memberUser = member.user;
											const owner = isOwner(member);
											const locked = isLocked(member);
											return (
												<tr
													key={member._id}
													className={`!border-surface-300-700 !border-t ${
														memberUser ? 'hover:bg-surface-100-900 cursor-pointer' : ''
													}`}
													onClick={() => memberUser && onViewProfile(memberUser._id)}
												>
													<td className="max-w-0 !py-3 !pl-0">
														<div className="flex items-center gap-3">
															<Avatar.Root className="size-8 shrink-0">
																<Avatar.Image
																	src={memberUser?.image ?? undefined}
																	alt={memberUser?.name ?? ''}
																/>
																<Avatar.Fallback>
																	<Avatar.Marble name={memberUser?.name ?? '?'} />
																</Avatar.Fallback>
															</Avatar.Root>
															<div className="flex min-w-0 flex-col">
																<div className="flex min-w-0 items-center gap-2">
																	{memberUser ? (
																		// The keyboard way to the profile; the row handles pointer clicks
																		<button
																			type="button"
																			className="truncate text-left text-sm font-medium hover:underline"
																			onClick={(event) => {
																				event.stopPropagation();
																				onViewProfile(memberUser._id);
																			}}
																		>
																			{memberUser.name}
																		</button>
																	) : (
																		<span className="text-surface-600-400 truncate text-sm">
																			Deleted user
																		</span>
																	)}
																	{memberUser && memberUser._id === activeUserId ? (
																		<span className="badge preset-tonal shrink-0">You</span>
																	) : null}
																	{memberUser?.isAppAdmin ? (
																		<span className="badge preset-filled-warning-50-950 border-warning-200-800 shrink-0 border">
																			Admin
																		</span>
																	) : null}
																	{memberUser?.banned ? (
																		<span className="badge preset-filled-error-50-950 border-error-200-800 shrink-0 border">
																			Banned
																		</span>
																	) : null}
																</div>
																<span className="text-surface-600-400 truncate text-xs">
																	{memberUser?.email}
																</span>
															</div>
														</div>
													</td>
													<td className="text-surface-600-400 hidden text-sm md:table-cell">
														{formatDate(member.createdAt)}
													</td>
													{/* Clicks on the role and the menu, portaled or not, bubble through React to the row: stop them here */}
													<td onClick={(event) => event.stopPropagation()}>
														{owner ? (
															<RoleBadge label="Owner" owner />
														) : locked || !memberUser ? (
															<RoleBadge label={roleOf(member)} />
														) : (
															<select
																className="select w-full cursor-pointer text-sm"
																value={roleOf(member)}
																onChange={(e) =>
																	handleRoleChange(member, e.target.value as OrganizationRole)
																}
																aria-label={`Role of ${memberUser?.name}`}
															>
																<option value="member">Member</option>
																<option value="admin">Admin</option>
															</select>
														)}
													</td>
													<td className="text-right" onClick={(event) => event.stopPropagation()}>
														<Menu.Root>
															<Menu.Trigger
																className="btn-icon hover:preset-tonal"
																aria-label={`Actions for ${memberUser?.name ?? 'deleted user'}`}
															>
																<EllipsisVertical className="size-4" aria-hidden="true" />
															</Menu.Trigger>
															<Portal>
																<Menu.Content className="bg-surface-50-950 min-w-52">
																	{memberUser ? (
																		<Menu.Item
																			value="profile"
																			className="gap-3"
																			onClick={() => onViewProfile(memberUser._id)}
																		>
																			<CircleUser className="size-4" aria-hidden="true" />
																			View profile
																		</Menu.Item>
																	) : null}
																	{owner ? (
																		<Menu.Item
																			value="transfer"
																			className={`gap-3 ${DISABLED_ITEM}`}
																			disabled={!canTransfer || successors.length === 0}
																			onClick={() => openTransfer()}
																		>
																			<Crown className="size-4" aria-hidden="true" />
																			Transfer ownership
																		</Menu.Item>
																	) : !locked ? (
																		<>
																			{memberUser ? (
																				<>
																					<Menu.Item
																						value="make-owner"
																						className={`gap-3 ${DISABLED_ITEM}`}
																						disabled={!canTransfer}
																						onClick={() => openTransfer(member)}
																					>
																						<Crown className="size-4" aria-hidden="true" />
																						Make owner
																					</Menu.Item>
																					<Menu.Separator />
																				</>
																			) : null}
																			<Menu.Item
																				value="remove"
																				variant="destructive"
																				className="gap-3"
																				onClick={() => handleRemove(member)}
																			>
																				<UserMinus className="size-4" aria-hidden="true" />
																				Remove from organization
																			</Menu.Item>
																		</>
																	) : null}
																</Menu.Content>
															</Portal>
														</Menu.Root>
													</td>
												</tr>
											);
										})}
									</tbody>
								</table>
								{owners.length > 0 && !canTransfer ? (
									<p className="text-surface-600-400 text-xs">
										The owner is an app admin: remove their admin role to hand over the ownership.
									</p>
								) : owners.length > 0 && successors.length === 0 ? (
									<p className="text-surface-600-400 text-xs">
										To hand over the ownership, add another member first.
									</p>
								) : null}
							</>
						)}
					</section>
				</>
			)}

			{/* Transfer ownership dialog */}
			<Dialog.Root open={transferOpen} onOpenChange={setTransferOpen} lazyMount unmountOnExit>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Transfer ownership of {organization?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							The new owner can manage and delete the organization, and can&apos;t be removed from
							it until they hand it over.
						</Dialog.Description>
					</Dialog.Header>
					<form
						id={`${formId}-transfer`}
						className="flex w-full flex-col gap-3"
						onSubmit={handleTransfer}
					>
						<label className="label">
							<span className="label-text">New owner</span>
							<select
								className="select"
								value={successorId}
								onChange={(e) => setSuccessorId(e.target.value)}
								required
							>
								{successors.map((member) => (
									<option key={member._id} value={member._id}>
										{member.user?.name} ({member.user?.email})
									</option>
								))}
							</select>
						</label>
						{owners.length > 0 ? (
							<label className="label">
								<span className="label-text">
									{owners.length === 1
										? `${owners[0].user?.name ?? 'The previous owner'} becomes`
										: 'The previous owners become'}
								</span>
								<select
									className="select"
									value={previousOwner}
									onChange={(e) => setPreviousOwner(e.target.value as PreviousOwner)}
								>
									<option value="admin">Admin</option>
									<option value="member">Member</option>
									<option value="remove">Removed from the organization</option>
								</select>
							</label>
						) : null}
					</form>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={transferring}>
							Cancel
						</Dialog.Close>
						<button
							type="submit"
							form={`${formId}-transfer`}
							className="btn preset-filled-primary-500"
							disabled={transferring || !successorId}
							aria-busy={transferring}
						>
							{transferring ? (
								<>
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
									Transferring...
								</>
							) : (
								'Transfer ownership'
							)}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Add member dialog */}
			<Dialog.Root open={addOpen} onOpenChange={setAddOpen} lazyMount unmountOnExit>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Add a member to {organization?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							They become a member right away, without an invitation.
						</Dialog.Description>
					</Dialog.Header>
					<form id={`${formId}-add`} className="flex w-full flex-col gap-3" onSubmit={handleAdd}>
						<div className="label">
							<label className="label-text" htmlFor={`${formId}-add-user`}>
								User
							</label>
							<UserSelect
								id={`${formId}-add-user`}
								value={addUser}
								onChange={setAddUser}
								excludeIds={memberUserIds}
								unavailableReason={(user) =>
									user.isAppAdmin && user.id !== activeUserId
										? 'App admin: remove their admin role first'
										: undefined
								}
							/>
						</div>
						<label className="label">
							<span className="label-text">Role</span>
							<select
								className="select"
								value={addRole}
								onChange={(e) => setAddRole(e.target.value as OrganizationRole)}
							>
								<option value="member">Member</option>
								<option value="admin">Admin</option>
							</select>
						</label>
					</form>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={adding}>
							Cancel
						</Dialog.Close>
						<button
							type="submit"
							form={`${formId}-add`}
							className="btn preset-filled-primary-500"
							disabled={adding || !addUser}
							aria-busy={adding}
						>
							{adding ? (
								<>
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
									Adding...
								</>
							) : (
								'Add'
							)}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</div>
	);
}
