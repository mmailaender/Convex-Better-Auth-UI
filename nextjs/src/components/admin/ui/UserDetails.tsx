'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { ArrowLeft, Check, Copy, Loader2, LogOut, Plus, X } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import { useActiveUserData } from '@/lib/auth/hooks';
import OrganizationSelect from '@/components/admin/ui/OrganizationSelect';
import UserActionsMenu from '@/components/admin/ui/UserActionsMenu';
import UserDialogs from '@/components/admin/ui/UserDialogs';
import { describeUserAgent } from '@/components/admin/utils/userAgent';
import type {
	AdminMembership,
	AdminOrganization,
	OrganizationRole,
	UserDialog
} from '@/components/admin/types';

type UserDetailsProps = {
	userId: string;
	/** Returns to the users table */
	onBack: () => void;
};

function formatDate(epochMs: number): string {
	return new Date(epochMs).toLocaleDateString();
}

function formatDateTime(epochMs: number): string {
	return new Date(epochMs).toLocaleString();
}

/** A member's roles, which Better Auth stores comma-separated. */
function rolesOf(membership: AdminMembership): string[] {
	return membership.role.split(',').map((role) => role.trim());
}

function isOwner(membership: AdminMembership): boolean {
	return rolesOf(membership).includes('owner');
}

/** The role the role select shows: a member with several roles shows the highest. */
function roleOf(membership: AdminMembership): OrganizationRole {
	return rolesOf(membership).includes('admin') ? 'admin' : 'member';
}

function CopyButton({ text, label }: { text: string; label: string }) {
	const [copied, setCopied] = useState(false);
	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		} catch {
			toast.error("Couldn't copy");
		}
	}
	return (
		<button
			type="button"
			className="hover:preset-tonal rounded-base flex size-6 shrink-0 items-center justify-center"
			aria-label={copied ? 'Copied' : label}
			onClick={copy}
		>
			{copied ? (
				<Check className="size-4" aria-hidden="true" />
			) : (
				<Copy className="size-4" aria-hidden="true" />
			)}
		</button>
	);
}

/**
 * The admin dashboard's profile of a user: their details, which admins can edit, their
 * organization memberships and their sessions, plus the actions of the users table.
 */
export default function UserDetails({ userId, onBack }: UserDetailsProps) {
	const activeUser = useActiveUserData();
	const details = useQuery(api.admin.queries.getUser, { userId });
	const user = details?.user ?? null;
	const sessions = useQuery(
		api.admin.queries.listUserSessions,
		user ? { userId: user.id } : 'skip'
	);

	const updateUser = useMutation(api.admin.mutations.updateUser);
	const updateMemberRole = useMutation(api.admin.mutations.updateMemberRole);
	const removeMember = useMutation(api.admin.mutations.removeMember);
	const addMember = useMutation(api.admin.mutations.addMember);
	const revokeUserSession = useMutation(api.admin.mutations.revokeUserSession);

	const isSelf = user?.id === activeUser?._id;
	// Changing the profile or the sessions of another admin needs their admin role removed first:
	// see `assertCanManageUser`
	const canManage = Boolean(user) && (isSelf || !user?.isAppAdmin);

	const [dialog, setDialog] = useState<UserDialog | null>(null);

	// Profile form. Fields the admin hasn't edited follow the user as it changes elsewhere
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [saving, setSaving] = useState(false);
	const [loaded, setLoaded] = useState<{ id: string; name: string; email: string } | null>(null);
	if (
		user &&
		(user.id !== loaded?.id || user.name !== loaded.name || user.email !== loaded.email)
	) {
		const otherUser = user.id !== loaded?.id;
		if (otherUser || name === loaded?.name) setName(user.name);
		if (otherUser || email === loaded?.email) setEmail(user.email);
		setLoaded({ id: user.id, name: user.name, email: user.email });
	}
	const isDirty =
		Boolean(user) && (name.trim() !== user?.name || email.trim().toLowerCase() !== user?.email);

	// Add to organization dialog
	const [addOpen, setAddOpen] = useState(false);
	const [addOrganization, setAddOrganization] = useState<AdminOrganization | null>(null);
	const [addRole, setAddRole] = useState<OrganizationRole>('member');
	const [adding, setAdding] = useState(false);
	const memberOrganizationIds =
		details?.memberships.map((membership) => membership.organization._id) ?? [];

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
		if (!user) return;
		setSaving(true);
		// Only the edited fields, so a change made elsewhere meanwhile isn't overwritten
		const done = await run(
			() =>
				updateUser({
					userId: user.id,
					name: name.trim() !== user.name ? name : undefined,
					email: email.trim().toLowerCase() !== user.email ? email : undefined
				}),
			'Saved the profile',
			'Failed to save the profile'
		);
		// Show what the server stored, such as the lowercased email
		if (done) setLoaded(null);
		setSaving(false);
	}

	function handleRoleChange(membership: AdminMembership, role: OrganizationRole) {
		if (role === membership.role) return;
		// Selecting what a member with several roles already shows makes that their only role
		void run(
			() => updateMemberRole({ memberId: membership._id, role }),
			`${user?.name} is now ${role === 'admin' ? 'an admin' : 'a member'} of ${membership.organization.name}`,
			'Failed to change the role'
		);
	}

	function handleRemoveMembership(membership: AdminMembership) {
		void run(
			() => removeMember({ memberId: membership._id }),
			`Removed ${user?.name} from ${membership.organization.name}`,
			'Failed to remove the membership'
		);
	}

	function openAddDialog() {
		setAddOrganization(null);
		setAddRole('member');
		setAddOpen(true);
	}

	async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!user || !addOrganization) return;
		const organization = addOrganization;
		setAdding(true);
		const done = await run(
			() => addMember({ userId: user.id, organizationId: organization._id, role: addRole }),
			`Added ${user.name} to ${organization.name}`,
			'Failed to add to the organization'
		);
		setAdding(false);
		if (done) setAddOpen(false);
	}

	function handleRevokeSession(sessionId: string) {
		void run(
			() => revokeUserSession({ sessionId }),
			'Signed out the session',
			'Failed to sign out the session'
		);
	}

	const banDescription = user?.banned
		? `Banned ${user.banExpires ? `until ${formatDateTime(user.banExpires)}` : 'permanently'}${
				user.banReason ? `: ${user.banReason}` : '.'
			}`
		: '';

	return (
		<div className="flex flex-col gap-6 py-4">
			<button
				type="button"
				className="btn hover:preset-tonal w-fit gap-2 px-2 text-sm"
				onClick={onBack}
			>
				<ArrowLeft className="size-4" aria-hidden="true" />
				Users
			</button>

			{details === undefined ? (
				<div className="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					Loading user...
				</div>
			) : !details || !user ? (
				<div className="text-surface-600-400 text-sm">This user doesn&apos;t exist anymore.</div>
			) : (
				<>
					{/* Header */}
					<header className="flex items-start gap-4">
						<Avatar.Root className="size-16 shrink-0">
							<Avatar.Image src={user.image ?? undefined} alt={user.name} />
							<Avatar.Fallback>
								<Avatar.Marble name={user.name} />
							</Avatar.Fallback>
						</Avatar.Root>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="flex flex-wrap items-center gap-2">
								<h2 className="h4 truncate">{user.name}</h2>
								{isSelf ? <span className="badge preset-tonal">You</span> : null}
								{user.isAppAdmin ? (
									<span
										className="badge preset-filled-warning-50-950 border-warning-200-800 border"
										title={
											user.isBootstrapAdmin
												? 'Admin through the ADMIN_USER_IDS environment variable'
												: undefined
										}
									>
										Admin
									</span>
								) : null}
								{user.banned ? (
									<span className="badge preset-filled-error-50-950 border-error-200-800 border">
										Banned
									</span>
								) : null}
							</div>
							<p className="text-surface-600-400 truncate text-sm">{user.email}</p>
							<div className="text-surface-600-400 flex items-center gap-1 text-xs">
								<span className="shrink-0">User ID</span>
								<code className="truncate">{user.id}</code>
								<CopyButton text={user.id} label="Copy user ID" />
							</div>
						</div>
						<UserActionsMenu user={user} isSelf={isSelf} onDialog={setDialog} />
					</header>

					{user.banned ? (
						<div className="card preset-tonal-error border-error-200-800 border p-4 text-sm">
							{banDescription}
						</div>
					) : null}

					{/* Profile */}
					<section className="card border-surface-300-700 flex flex-col gap-4 border p-4">
						<h3 className="h6">Profile</h3>
						<form className="flex flex-col gap-3" onSubmit={handleSave}>
							<fieldset className="grid gap-3 sm:grid-cols-2" disabled={!canManage || saving}>
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
									<span className="label-text">Email</span>
									<input
										type="email"
										className="input"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										autoComplete="off"
										required
									/>
								</label>
							</fieldset>
							<div className="flex flex-wrap items-center justify-between gap-3">
								<p className="text-surface-600-400 text-xs">
									{canManage
										? 'A new email counts as verified, and they sign in with it from now on.'
										: 'Remove their admin role to change their profile.'}
								</p>
								{canManage ? (
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
								) : null}
							</div>
						</form>
						<dl className="border-surface-300-700 grid gap-3 border-t pt-4 text-sm sm:grid-cols-3">
							<div>
								<dt className="text-surface-600-400 text-xs">Joined</dt>
								<dd>{formatDate(user.createdAt)}</dd>
							</div>
							<div>
								<dt className="text-surface-600-400 text-xs">Email</dt>
								<dd>{user.emailVerified ? 'Verified' : 'Not verified'}</dd>
							</div>
							<div>
								<dt className="text-surface-600-400 text-xs">Role</dt>
								<dd>
									{user.isBootstrapAdmin
										? 'Admin (ADMIN_USER_IDS)'
										: user.isAppAdmin
											? 'Admin'
											: 'User'}
								</dd>
							</div>
						</dl>
					</section>

					{/* Organizations */}
					{AUTH_CONSTANTS.organizations ? (
						<section className="card border-surface-300-700 flex flex-col gap-3 border p-4">
							<div className="flex items-center justify-between gap-3">
								<h3 className="h6">Organizations</h3>
								{canManage ? (
									<button
										type="button"
										className="btn btn-sm preset-tonal gap-2"
										onClick={openAddDialog}
									>
										<Plus className="size-4" aria-hidden="true" />
										Add to organization
									</button>
								) : null}
							</div>
							{!canManage ? (
								<p className="text-surface-600-400 text-xs">
									Remove their admin role to change their organizations.
								</p>
							) : null}
							{details.memberships.length === 0 ? (
								<p className="text-surface-600-400 text-sm">Not a member of any organization.</p>
							) : (
								<ul className="flex flex-col">
									{details.memberships.map((membership) => (
										<li
											key={membership._id}
											className="border-surface-300-700 flex items-center gap-3 border-t py-3 first:border-t-0"
										>
											<Avatar.Root className="size-8 shrink-0">
												<Avatar.Image
													src={membership.organization.logo ?? undefined}
													alt={membership.organization.name}
												/>
												<Avatar.Fallback>
													<Avatar.Marble name={membership.organization.name} />
												</Avatar.Fallback>
											</Avatar.Root>
											<div className="flex min-w-0 flex-1 flex-col">
												<span className="truncate text-sm">{membership.organization.name}</span>
												<span className="text-surface-600-400 truncate text-xs">
													{membership.organization.slug}
												</span>
											</div>
											{isOwner(membership) ? (
												<>
													<span
														className="badge preset-filled-primary-50-950 border-primary-200-800 border"
														title="The owner keeps their role and can't be removed"
													>
														Owner
													</span>
													{/* Keeps the role column aligned with the rows that have a remove button */}
													<span className="size-8 shrink-0" aria-hidden="true" />
												</>
											) : !canManage ? (
												<>
													<span className="badge preset-tonal capitalize">
														{roleOf(membership)}
													</span>
													<span className="size-8 shrink-0" aria-hidden="true" />
												</>
											) : (
												<>
													<select
														className="select w-32 shrink-0 cursor-pointer text-sm"
														value={roleOf(membership)}
														onChange={(e) =>
															handleRoleChange(membership, e.target.value as OrganizationRole)
														}
														aria-label={`Role in ${membership.organization.name}`}
													>
														<option value="member">Member</option>
														<option value="admin">Admin</option>
													</select>
													<button
														type="button"
														className="btn-icon hover:preset-tonal size-8 shrink-0"
														aria-label={`Remove from ${membership.organization.name}`}
														title={`Remove from ${membership.organization.name}`}
														onClick={() => handleRemoveMembership(membership)}
													>
														<X className="size-4" aria-hidden="true" />
													</button>
												</>
											)}
										</li>
									))}
								</ul>
							)}
						</section>
					) : null}

					{/* Sessions */}
					<section className="card border-surface-300-700 flex flex-col gap-3 border p-4">
						<h3 className="h6">Active sessions</h3>
						{!sessions ? (
							<p className="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								Loading sessions...
							</p>
						) : sessions.length === 0 ? (
							<p className="text-surface-600-400 text-sm">Not signed in anywhere.</p>
						) : (
							<ul className="flex flex-col">
								{sessions.map((session) => (
									<li
										key={session.id}
										className="border-surface-300-700 flex items-center gap-3 border-t py-3 first:border-t-0"
									>
										<div className="flex min-w-0 flex-1 flex-col">
											<div className="flex items-center gap-2">
												<span className="truncate text-sm">
													{describeUserAgent(session.userAgent)}
												</span>
												{session.impersonatedBy ? (
													<span className="badge preset-tonal shrink-0">Impersonation</span>
												) : null}
											</div>
											<span className="text-surface-600-400 truncate text-xs">
												{session.ipAddress ? `${session.ipAddress} · ` : ''}Signed in{' '}
												{formatDateTime(session.createdAt)}
											</span>
										</div>
										{canManage ? (
											<button
												type="button"
												className="btn btn-sm hover:preset-tonal shrink-0 gap-2"
												onClick={() => handleRevokeSession(session.id)}
											>
												<LogOut className="size-4" aria-hidden="true" />
												Sign out
											</button>
										) : null}
									</li>
								))}
							</ul>
						)}
					</section>
				</>
			)}

			<UserDialogs user={user} dialog={dialog} onDialogChange={setDialog} onDeleted={onBack} />

			{/* Add to organization dialog */}
			<Dialog.Root open={addOpen} onOpenChange={setAddOpen}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>Add {user?.name} to an organization</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							They become a member right away, without an invitation.
						</Dialog.Description>
					</Dialog.Header>
					<form
						id="admin-add-membership"
						className="flex w-full flex-col gap-3"
						onSubmit={handleAdd}
					>
						<div className="label">
							<label className="label-text" htmlFor="admin-add-membership-organization">
								Organization
							</label>
							<OrganizationSelect
								id="admin-add-membership-organization"
								value={addOrganization}
								onChange={setAddOrganization}
								excludeIds={memberOrganizationIds}
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
							form="admin-add-membership"
							className="btn preset-filled-primary-500"
							disabled={adding || !addOrganization}
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
