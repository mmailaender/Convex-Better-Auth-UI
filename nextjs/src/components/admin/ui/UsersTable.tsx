'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { EllipsisVertical, Loader2, Search } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Menu from '@/components/primitives/ui/menu';
import * as Password from '@/components/primitives/ui/password';
import { authClient } from '@/lib/auth/api/auth-client';
import { useActiveUserData } from '@/lib/auth/hooks';
import CreateUser from '@/components/admin/ui/CreateUser';
import { USERS_MAX, USERS_PAGE_SIZE } from '@/components/admin/utils/admin.constants';
import type { AdminUser, AppRole } from '@/components/admin/types';

const BAN_DURATIONS = [
	{ label: 'Permanent', value: '' },
	{ label: '1 hour', value: String(60 * 60) },
	{ label: '1 day', value: String(60 * 60 * 24) },
	{ label: '7 days', value: String(60 * 60 * 24 * 7) },
	{ label: '30 days', value: String(60 * 60 * 24 * 30) }
];

type UserDialog = 'ban' | 'delete' | 'password';

function errorMessage(error: unknown, fallback: string): string {
	return error instanceof Error ? error.message : fallback;
}

function banTitle(user: AdminUser): string {
	const until = user.banExpires ? `until ${new Date(user.banExpires).toLocaleString()}` : '';
	return ['Banned', until, user.banReason ? `: ${user.banReason}` : ''].join(' ').trim();
}

/**
 * Admin users management table. Lists every user with search, role management,
 * ban/unban, password reset, impersonation and deletion. All privileged calls go
 * through admin-gated Convex functions (impersonation goes through the Better
 * Auth client directly, since it manipulates the session).
 */
export default function UsersTable() {
	const activeUser = useActiveUserData();
	const [searchInput, setSearchInput] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [limit, setLimit] = useState(USERS_PAGE_SIZE);

	// Search runs 250ms after the last keystroke instead of on every one
	useEffect(() => {
		const timer = setTimeout(() => setSearchQuery(searchInput.trim()), 250);
		return () => clearTimeout(timer);
	}, [searchInput]);

	const result = useQuery(api.admin.queries.listUsers, {
		searchValue: searchQuery || undefined,
		limit
	});
	// Keep showing the previous result while a new search or page loads
	const [data, setData] = useState(result);
	if (result !== undefined && result !== data) setData(result);
	const isStale = result === undefined && data !== undefined;
	const users = data?.users ?? [];

	// Mutations
	const setRole = useMutation(api.admin.mutations.setRole);
	const banUser = useMutation(api.admin.mutations.banUser);
	const unbanUser = useMutation(api.admin.mutations.unbanUser);
	const removeUser = useMutation(api.admin.mutations.removeUser);
	const setUserPassword = useMutation(api.admin.mutations.setUserPassword);
	const revokeUserSessions = useMutation(api.admin.mutations.revokeUserSessions);

	// Dialog state
	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [openDialog, setOpenDialog] = useState<UserDialog | null>(null);
	const [banReason, setBanReason] = useState('');
	const [banExpiresIn, setBanExpiresIn] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const isSelf = (user: AdminUser) => user.id === activeUser?._id;

	function showDialog(user: AdminUser, dialog: UserDialog) {
		setSelectedUser(user);
		setBanReason('');
		setBanExpiresIn('');
		setNewPassword('');
		setOpenDialog(dialog);
	}

	function dialogProps(dialog: UserDialog) {
		return {
			open: openDialog === dialog,
			onOpenChange: (open: boolean) => setOpenDialog(open ? dialog : null)
		};
	}

	async function handleRoleChange(user: AdminUser, role: AppRole) {
		if (role === (user.isAppAdmin ? 'admin' : 'user')) return;
		try {
			await setRole({ userId: user.id, role });
			toast.success(`${user.name} is now ${role === 'admin' ? 'an admin' : 'a user'}`);
		} catch (error) {
			toast.error(errorMessage(error, 'Failed to update role'));
		}
	}

	async function handleUnban(user: AdminUser) {
		try {
			await unbanUser({ userId: user.id });
			toast.success(`Unbanned ${user.name}`);
		} catch (error) {
			toast.error(errorMessage(error, 'Failed to unban user'));
		}
	}

	async function handleRevokeSessions(user: AdminUser) {
		try {
			await revokeUserSessions({ userId: user.id });
			toast.success(`Signed ${user.name} out everywhere`);
		} catch (error) {
			toast.error(errorMessage(error, 'Failed to revoke sessions'));
		}
	}

	async function handleImpersonate(user: AdminUser) {
		const { error } = await authClient.admin.impersonateUser({ userId: user.id });
		if (error) {
			toast.error(error.message ?? 'Failed to impersonate user');
			return;
		}
		// Refresh the Convex JWT cookie the server renders with, then reload so every query
		// runs as the impersonated user
		await authClient.getSession();
		// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a client-side navigation would keep the admin's session state
		window.location.assign('/');
	}

	async function submitDialog(action: () => Promise<unknown>, success: string, failure: string) {
		setSubmitting(true);
		try {
			await action();
			toast.success(success);
			setOpenDialog(null);
		} catch (error) {
			toast.error(errorMessage(error, failure));
		} finally {
			setSubmitting(false);
		}
	}

	function handleBanSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const user = selectedUser;
		if (!user) return;
		void submitDialog(
			() =>
				banUser({
					userId: user.id,
					banReason: banReason.trim() || undefined,
					banExpiresIn: banExpiresIn ? Number(banExpiresIn) : undefined
				}),
			`Banned ${user.name}`,
			'Failed to ban user'
		);
	}

	function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const user = selectedUser;
		if (!user) return;
		void submitDialog(
			() => setUserPassword({ userId: user.id, newPassword }),
			`Updated the password of ${user.name}`,
			'Failed to set password'
		);
	}

	function handleDeleteSubmit() {
		const user = selectedUser;
		if (!user) return;
		void submitDialog(
			() => removeUser({ userId: user.id }),
			`Deleted ${user.name}`,
			'Failed to delete user'
		);
	}

	const submitLabel = (idle: string, busy: string) =>
		submitting ? (
			<>
				<Loader2 className="size-4 animate-spin" aria-hidden="true" />
				{busy}
			</>
		) : (
			idle
		);

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 items-center gap-3 py-4">
				<div className="relative flex-1">
					<div className="pointer-events-none absolute inset-y-0 flex items-center">
						<Search className="text-surface-400-600 size-4" aria-hidden="true" />
					</div>
					<input
						type="search"
						className="input w-full !border-0 border-transparent pl-6 text-sm"
						placeholder="Search by name or email..."
						aria-label="Search users by name or email"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
				</div>
				{data ? (
					<span className="text-surface-600-400 hidden text-xs whitespace-nowrap sm:inline">
						{data.total} {data.total === 1 ? 'user' : 'users'}
					</span>
				) : null}
				<CreateUser />
			</div>

			{!data ? (
				<div className="text-surface-600-400 flex items-center gap-2 p-4 text-sm" role="status">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					Loading users...
				</div>
			) : users.length === 0 ? (
				<div className="text-surface-600-400 p-4 text-sm">
					{searchQuery ? `No users match "${searchQuery}".` : 'No users yet.'}
				</div>
			) : (
				<div
					className={`max-h-[calc(80vh-12rem)] overflow-y-auto pb-12 transition-opacity ${
						isStale ? 'opacity-60' : ''
					}`}
				>
					<table className="table w-full">
						<thead className="bg-surface-50-950 sticky top-0 z-20">
							<tr>
								<th className="text-surface-600-400 p-2 !pl-3 text-left text-xs font-semibold">
									User
								</th>
								<th className="text-surface-600-400 hidden p-2 text-left text-xs sm:table-cell">
									Email
								</th>
								<th className="text-surface-600-400 w-32 p-2 text-left text-xs">Role</th>
								<th className="text-surface-600-400 hidden w-28 p-2 text-left text-xs md:table-cell">
									Joined
								</th>
								<th className="w-12 p-2">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr key={user.id} className="!border-surface-300-700 !border-t">
									<td className="max-w-0 !py-3 !pl-3">
										<div className="flex items-center gap-2">
											<Avatar.Root className="size-8 shrink-0 sm:size-6">
												<Avatar.Image src={user.image ?? undefined} alt={user.name} />
												<Avatar.Fallback>
													<Avatar.Marble name={user.name} />
												</Avatar.Fallback>
											</Avatar.Root>
											<div className="flex min-w-0 flex-col">
												<div className="flex min-w-0 items-center gap-2">
													<span className="truncate text-sm">{user.name}</span>
													{isSelf(user) ? (
														<span className="badge preset-tonal shrink-0">You</span>
													) : null}
													{user.banned ? (
														<span
															className="badge preset-filled-error-50-950 border-error-200-800 shrink-0 border"
															title={banTitle(user)}
														>
															Banned
														</span>
													) : null}
												</div>
												<span className="text-surface-700-300 truncate text-xs sm:hidden">
													{user.email}
												</span>
											</div>
										</div>
									</td>
									<td className="text-surface-600-400 hidden max-w-0 truncate text-sm sm:table-cell">
										{user.email}
									</td>
									<td>
										{isSelf(user) || user.isBootstrapAdmin ? (
											<span
												className="badge preset-filled-warning-50-950 border-warning-200-800 h-7 border px-2"
												title={
													user.isBootstrapAdmin
														? 'Admin through the ADMIN_USER_IDS environment variable'
														: "You can't change your own role"
												}
											>
												{user.isAppAdmin ? 'Admin' : 'User'}
											</span>
										) : (
											<select
												value={user.isAppAdmin ? 'admin' : 'user'}
												onChange={(e) => handleRoleChange(user, e.target.value as AppRole)}
												className="select cursor-pointer text-sm"
												aria-label={`Role of ${user.name}`}
											>
												<option value="user">User</option>
												<option value="admin">Admin</option>
											</select>
										)}
									</td>
									<td className="text-surface-600-400 hidden text-sm md:table-cell">
										{new Date(user.createdAt).toLocaleDateString()}
									</td>
									<td className="text-right">
										{!isSelf(user) && !user.isAppAdmin ? (
											<Menu.Root>
												<Menu.Trigger
													className="btn-icon hover:preset-tonal"
													aria-label={`Actions for ${user.name}`}
												>
													<EllipsisVertical className="size-4" aria-hidden="true" />
												</Menu.Trigger>
												<Menu.Content className="bg-surface-50-950">
													{!user.banned ? (
														<Menu.Item value="impersonate" onClick={() => handleImpersonate(user)}>
															Impersonate
														</Menu.Item>
													) : null}
													<Menu.Item value="password" onClick={() => showDialog(user, 'password')}>
														Set password
													</Menu.Item>
													<Menu.Item value="revoke" onClick={() => handleRevokeSessions(user)}>
														Sign out everywhere
													</Menu.Item>
													{user.banned ? (
														<Menu.Item value="unban" onClick={() => handleUnban(user)}>
															Unban
														</Menu.Item>
													) : (
														<Menu.Item value="ban" onClick={() => showDialog(user, 'ban')}>
															Ban
														</Menu.Item>
													)}
													<Menu.Item
														value="delete"
														variant="destructive"
														onClick={() => showDialog(user, 'delete')}
													>
														Delete
													</Menu.Item>
												</Menu.Content>
											</Menu.Root>
										) : null}
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{data.hasMore && limit < USERS_MAX ? (
						<div className="flex justify-center py-3">
							<button
								type="button"
								className="btn preset-tonal"
								onClick={() => setLimit(Math.min(limit + USERS_PAGE_SIZE, USERS_MAX))}
								disabled={isStale}
							>
								Load more
							</button>
						</div>
					) : null}
				</div>
			)}

			{/* Ban dialog */}
			<Dialog.Root {...dialogProps('ban')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>Ban {selectedUser?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							They are signed out everywhere and can&apos;t sign in until the ban ends or you lift
							it.
						</Dialog.Description>
					</Dialog.Header>
					<form id="admin-ban-user" className="flex flex-col gap-3" onSubmit={handleBanSubmit}>
						<label className="label">
							<span className="label-text">Reason (optional)</span>
							<input
								type="text"
								className="input"
								value={banReason}
								onChange={(e) => setBanReason(e.target.value)}
								placeholder="Violation of terms"
							/>
						</label>
						<label className="label">
							<span className="label-text">Duration</span>
							<select
								className="select"
								value={banExpiresIn}
								onChange={(e) => setBanExpiresIn(e.target.value)}
							>
								{BAN_DURATIONS.map((duration) => (
									<option key={duration.value} value={duration.value}>
										{duration.label}
									</option>
								))}
							</select>
						</label>
					</form>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="submit"
							form="admin-ban-user"
							className="btn preset-filled-error-500"
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Ban user', 'Banning...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Set password dialog */}
			<Dialog.Root {...dialogProps('password')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>Set password for {selectedUser?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							If they sign in without a password today, they can also use their email and this
							password from now on. Their existing sessions stay signed in.
						</Dialog.Description>
					</Dialog.Header>
					<form id="admin-set-password" onSubmit={handlePasswordSubmit}>
						<label className="label">
							<span className="label-text">New password</span>
							<Password.Root minScore={0}>
								<Password.Input
									value={newPassword}
									onChange={(e) => setNewPassword(e.currentTarget.value)}
									autoComplete="new-password"
									minLength={8}
									required
								>
									<Password.ToggleVisibility />
								</Password.Input>
							</Password.Root>
						</label>
					</form>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="submit"
							form="admin-set-password"
							className="btn preset-filled-primary-500"
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Set password', 'Saving...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Delete dialog */}
			<Dialog.Root {...dialogProps('delete')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>Delete {selectedUser?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							This permanently deletes the account, its sessions and its organization memberships.
							If they own an organization with other members, delete it or make someone else its
							owner first. This can&apos;t be undone.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="button"
							className="btn preset-filled-error-500"
							onClick={handleDeleteSubmit}
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Delete user', 'Deleting...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</div>
	);
}
