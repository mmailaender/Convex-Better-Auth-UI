'use client';

import { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { Loader2, Search } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import { useActiveUserData } from '@/lib/auth/hooks';
import CreateUser from '@/components/admin/ui/CreateUser';
import UserActionsMenu from '@/components/admin/ui/UserActionsMenu';
import UserDialogs from '@/components/admin/ui/UserDialogs';
import { LIST_MAX, USERS_PAGE_SIZE } from '@/components/admin/utils/admin.constants';
import type { AdminUser, UserDialog } from '@/components/admin/types';

function banTitle(user: AdminUser): string {
	const until = user.banExpires ? `until ${new Date(user.banExpires).toLocaleString()}` : '';
	return ['Banned', until, user.banReason ? `: ${user.banReason}` : ''].join(' ').trim();
}

type UsersTableProps = {
	/** Opens the profile of a user */
	onViewProfile: (userId: string) => void;
};

/**
 * Admin users table. Lists every user with search; a row opens the user's profile, and its
 * actions menu covers impersonation, the admin role, passwords, sessions, bans and deletion.
 * All privileged calls go through admin-gated Convex functions (impersonation goes through the
 * Better Auth client directly, since it manipulates the session).
 */
export default function UsersTable({ onViewProfile }: UsersTableProps) {
	const activeUser = useActiveUserData();
	const [searchInput, setSearchInput] = useState('');
	const [searchQuery, setSearchQuery] = useState('');
	const [limit, setLimit] = useState(USERS_PAGE_SIZE);

	// Search runs 250ms after the last keystroke instead of on every one
	useEffect(() => {
		const timer = setTimeout(() => {
			setSearchQuery(searchInput.trim());
			setLimit(USERS_PAGE_SIZE);
		}, 250);
		return () => clearTimeout(timer);
	}, [searchInput]);

	// "Load more" raises the limit of one reactive list instead of adding cursor pages, so users
	// created or deleted meanwhile can't show twice or drop out
	const result = useQuery(api.admin.queries.listUsers, {
		searchValue: searchQuery || undefined,
		limit
	});
	// Keep showing the previous result, dimmed, while a new search or page loads
	const [data, setData] = useState(result);
	if (result !== undefined && result !== data) setData(result);
	const isStale = result === undefined && data !== undefined;
	const users = data?.users ?? [];

	const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
	const [dialog, setDialog] = useState<UserDialog | null>(null);

	const isSelf = (user: AdminUser) => user.id === activeUser?._id;

	function openDialog(user: AdminUser, next: UserDialog) {
		setSelectedUser(user);
		setDialog(next);
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 items-center gap-3 py-4">
				<div className="relative flex-1">
					<div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
						<Search className="text-surface-400-600 size-4" aria-hidden="true" />
					</div>
					<input
						type="search"
						className="input w-full !border-0 border-transparent pl-9 text-sm"
						placeholder="Search by name or email..."
						aria-label="Search users by name or email"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
					/>
				</div>
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
								<th className="text-surface-600-400 hidden w-32 p-2 text-left text-xs sm:table-cell">
									Joined
								</th>
								<th className="w-12 p-2">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{users.map((user) => (
								<tr
									key={user.id}
									className="!border-surface-300-700 hover:bg-surface-100-900 cursor-pointer !border-t"
									onClick={() => onViewProfile(user.id)}
								>
									<td className="max-w-0 !py-3 !pl-3">
										<div className="flex items-center gap-3">
											<Avatar.Root className="size-9 shrink-0">
												<Avatar.Image src={user.image ?? undefined} alt={user.name} />
												<Avatar.Fallback>
													<Avatar.Marble name={user.name} />
												</Avatar.Fallback>
											</Avatar.Root>
											<div className="flex min-w-0 flex-col">
												<div className="flex min-w-0 items-center gap-2">
													{/* The keyboard way to the profile; the row handles pointer clicks */}
													<button
														type="button"
														className="truncate text-left text-sm font-medium hover:underline"
														data-admin-focus={user.id}
														onClick={(event) => {
															event.stopPropagation();
															onViewProfile(user.id);
														}}
													>
														{user.name}
													</button>
													{isSelf(user) ? (
														<span className="badge preset-tonal shrink-0">You</span>
													) : null}
													{user.isAppAdmin ? (
														<span
															className="badge preset-filled-warning-50-950 border-warning-200-800 shrink-0 border"
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
														<span
															className="badge preset-filled-error-50-950 border-error-200-800 shrink-0 border"
															title={banTitle(user)}
														>
															Banned
														</span>
													) : null}
												</div>
												<span className="text-surface-600-400 truncate text-sm">{user.email}</span>
											</div>
										</div>
									</td>
									<td className="text-surface-600-400 hidden text-sm sm:table-cell">
										{new Date(user.createdAt).toLocaleDateString()}
									</td>
									{/* Clicks on the menu, portaled or not, bubble through React to the row: stop them here */}
									<td className="text-right" onClick={(event) => event.stopPropagation()}>
										<UserActionsMenu
											user={user}
											isSelf={isSelf(user)}
											onDialog={(next) => openDialog(user, next)}
											onViewProfile={() => onViewProfile(user.id)}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{searchQuery && !isStale && users.length >= USERS_PAGE_SIZE ? (
						<p className="text-surface-600-400 py-3 text-center text-xs">
							Showing the first {USERS_PAGE_SIZE} matches. Refine your search to narrow them down.
						</p>
					) : null}
					{data.hasMore && limit >= LIST_MAX ? (
						<p className="text-surface-600-400 py-3 text-center text-xs">
							Showing the newest {LIST_MAX} users. Search to find the others.
						</p>
					) : data.hasMore ? (
						<div className="flex justify-center py-3">
							<button
								type="button"
								className="btn preset-tonal"
								onClick={() => setLimit(Math.min(limit + USERS_PAGE_SIZE, LIST_MAX))}
								disabled={isStale}
							>
								Load more
							</button>
						</div>
					) : null}
				</div>
			)}

			<UserDialogs user={selectedUser} dialog={dialog} onDialogChange={setDialog} />
		</div>
	);
}
