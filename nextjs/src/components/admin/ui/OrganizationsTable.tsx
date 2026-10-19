'use client';

import { useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { ChevronRight, EllipsisVertical, Loader2, Trash2, Users } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Menu from '@/components/primitives/ui/menu';
import { Portal } from '@ark-ui/react/portal';
import { LIST_MAX } from '@/components/admin/utils/admin.constants';
import type { AdminOrganization } from '@/components/admin/types';

const PAGE_SIZE = 25;

const ROLE_BADGE: Record<string, string> = {
	owner: 'preset-filled-primary-50-950 border-primary-200-800',
	admin: 'preset-filled-warning-50-950 border-warning-200-800'
};

type OrganizationsTableProps = {
	/** Opens the profile of a user */
	onViewProfile: (userId: string) => void;
};

/**
 * Admin organizations management table. Lists every organization in the
 * deployment with a members view and force-delete. Members open their profile,
 * where admins change their roles and memberships. Only mounted when the
 * `organizations` feature toggle is enabled (enforced by {@link AdminDashboard}
 * and the server functions).
 */
export default function OrganizationsTable({ onViewProfile }: OrganizationsTableProps) {
	// "Load more" raises the limit of one reactive list, like the users table
	const [limit, setLimit] = useState(PAGE_SIZE);
	const result = useQuery(api.admin.queries.listAllOrganizations, { limit });
	// Keep showing the previous result while the next page loads
	const [data, setData] = useState(result);
	if (result !== undefined && result !== data) setData(result);
	const organizations = data?.organizations ?? [];

	const deleteOrganization = useMutation(api.admin.mutations.deleteOrganizationAsAdmin);

	const [selectedOrg, setSelectedOrg] = useState<AdminOrganization | null>(null);
	const [membersOpen, setMembersOpen] = useState(false);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const orgDetail = useQuery(
		api.admin.queries.getOrganizationWithMembers,
		membersOpen && selectedOrg ? { organizationId: selectedOrg._id } : 'skip'
	);

	function openDialog(org: AdminOrganization, dialog: 'members' | 'delete') {
		setSelectedOrg(org);
		setMembersOpen(dialog === 'members');
		setDeleteOpen(dialog === 'delete');
	}

	async function handleDelete() {
		const org = selectedOrg;
		if (!org) return;
		setDeleting(true);
		try {
			await deleteOrganization({ organizationId: org._id });
			toast.success(`Deleted ${org.name}`);
			setDeleteOpen(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
		} finally {
			setDeleting(false);
		}
	}

	return (
		<div className="flex h-full flex-col py-4">
			{!data ? (
				<div className="text-surface-600-400 flex items-center gap-2 p-4 text-sm" role="status">
					<Loader2 className="size-4 animate-spin" aria-hidden="true" />
					Loading organizations...
				</div>
			) : organizations.length === 0 ? (
				<div className="text-surface-600-400 p-4 text-sm">No organizations yet.</div>
			) : (
				<div className="max-h-[calc(80vh-12rem)] overflow-y-auto pb-12">
					<table className="table w-full">
						<thead className="bg-surface-50-950 sticky top-0 z-20">
							<tr>
								<th className="text-surface-600-400 p-2 !pl-3 text-left text-xs font-semibold">
									Name
								</th>
								<th className="text-surface-600-400 hidden p-2 text-left text-xs sm:table-cell">
									Slug
								</th>
								<th className="text-surface-600-400 hidden w-28 p-2 text-left text-xs md:table-cell">
									Created
								</th>
								<th className="w-12 p-2">
									<span className="sr-only">Actions</span>
								</th>
							</tr>
						</thead>
						<tbody>
							{organizations.map((org) => (
								<tr
									key={org._id}
									className="!border-surface-300-700 hover:bg-surface-100-900 cursor-pointer !border-t"
									onClick={() => openDialog(org, 'members')}
								>
									<td className="max-w-0 !py-3 !pl-3">
										<div className="flex items-center gap-2">
											<Avatar.Root className="size-8 shrink-0 sm:size-6">
												<Avatar.Image src={org.logo ?? undefined} alt={org.name} />
												<Avatar.Fallback>
													<Avatar.Marble name={org.name} />
												</Avatar.Fallback>
											</Avatar.Root>
											<div className="flex min-w-0 flex-col">
												{/* The keyboard way to the members; the row handles pointer clicks */}
												<button
													type="button"
													className="truncate text-left text-sm font-medium hover:underline"
													onClick={(event) => {
														event.stopPropagation();
														openDialog(org, 'members');
													}}
												>
													{org.name}
												</button>
												<span className="text-surface-700-300 truncate text-xs sm:hidden">
													{org.slug}
												</span>
											</div>
										</div>
									</td>
									<td className="text-surface-600-400 hidden max-w-0 truncate text-sm sm:table-cell">
										{org.slug}
									</td>
									<td className="text-surface-600-400 hidden text-sm md:table-cell">
										{new Date(org.createdAt).toLocaleDateString()}
									</td>
									{/* Clicks on the menu, portaled or not, bubble through React to the row: stop them here */}
									<td className="text-right" onClick={(event) => event.stopPropagation()}>
										<Menu.Root>
											<Menu.Trigger
												className="btn-icon hover:preset-tonal"
												aria-label={`Actions for ${org.name}`}
											>
												<EllipsisVertical className="size-4" aria-hidden="true" />
											</Menu.Trigger>
											{/* Portaled so the table's scroll container doesn't clip the menu */}
											<Portal>
												<Menu.Content className="bg-surface-50-950">
													<Menu.Item
														value="members"
														className="gap-3"
														onClick={() => openDialog(org, 'members')}
													>
														<Users className="size-4" aria-hidden="true" />
														View members
													</Menu.Item>
													<Menu.Separator />
													<Menu.Item
														value="delete"
														variant="destructive"
														className="gap-3"
														onClick={() => openDialog(org, 'delete')}
													>
														<Trash2 className="size-4" aria-hidden="true" />
														Delete organization
													</Menu.Item>
												</Menu.Content>
											</Portal>
										</Menu.Root>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{data.hasMore && limit >= LIST_MAX ? (
						<p className="text-surface-600-400 py-3 text-center text-xs">
							Showing the newest {LIST_MAX} organizations.
						</p>
					) : data.hasMore ? (
						<div className="flex justify-center py-3">
							<button
								type="button"
								className="btn preset-tonal"
								onClick={() => setLimit(Math.min(limit + PAGE_SIZE, LIST_MAX))}
								disabled={result === undefined}
							>
								Load more
							</button>
						</div>
					) : null}
				</div>
			)}

			{/* Members dialog */}
			<Dialog.Root open={membersOpen} onOpenChange={setMembersOpen}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>{selectedOrg?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							{orgDetail
								? `${orgDetail.members.length} ${orgDetail.members.length === 1 ? 'member' : 'members'}`
								: 'Members'}
						</Dialog.Description>
					</Dialog.Header>
					<div className="flex max-h-[60vh] w-full flex-col gap-1 overflow-y-auto px-2">
						{!orgDetail ? (
							<div className="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								Loading members...
							</div>
						) : orgDetail.members.length === 0 ? (
							<div className="text-surface-600-400 text-sm">No members.</div>
						) : (
							orgDetail.members.map((member) => {
								const memberUser = member.user;
								return (
									// Members open their profile, where admins change their roles and memberships
									<button
										key={member._id}
										type="button"
										className="hover:bg-surface-200-800 rounded-base -mx-2 flex items-center gap-3 p-2 text-left disabled:cursor-default disabled:hover:bg-transparent"
										disabled={!memberUser}
										onClick={() => {
											if (!memberUser) return;
											setMembersOpen(false);
											onViewProfile(memberUser._id);
										}}
									>
										<Avatar.Root className="size-8 shrink-0">
											<Avatar.Image
												src={memberUser?.image ?? undefined}
												alt={memberUser?.name ?? ''}
											/>
											<Avatar.Fallback>
												<Avatar.Marble name={memberUser?.name ?? '?'} />
											</Avatar.Fallback>
										</Avatar.Root>
										<div className="flex min-w-0 flex-1 flex-col">
											<span className="truncate text-sm">{memberUser?.name ?? 'Deleted user'}</span>
											<span className="text-surface-700-300 truncate text-xs">
												{memberUser?.email}
											</span>
										</div>
										<span
											className={`badge h-6 shrink-0 border px-2 capitalize ${
												ROLE_BADGE[member.role] ??
												'preset-filled-surface-300-700 border-surface-400-600'
											}`}
										>
											{member.role}
										</span>
										{memberUser ? (
											<ChevronRight className="size-4 shrink-0 opacity-60" aria-hidden="true" />
										) : null}
									</button>
								);
							})
						)}
					</div>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Delete dialog */}
			<Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header>
						<Dialog.Title>Delete {selectedOrg?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							This permanently deletes the organization with its memberships and pending
							invitations. Members who had it active switch to another of their organizations. This
							can&apos;t be undone.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={deleting}>
							Cancel
						</Dialog.Close>
						<button
							type="button"
							className="btn preset-filled-error-500"
							onClick={handleDelete}
							disabled={deleting}
							aria-busy={deleting}
						>
							{deleting ? (
								<>
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
									Deleting...
								</>
							) : (
								'Delete organization'
							)}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</div>
	);
}
