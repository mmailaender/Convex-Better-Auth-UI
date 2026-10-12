'use client';

import { useState } from 'react';
import { useMutation, usePaginatedQuery, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { EllipsisVertical, Loader2 } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Menu from '@/components/primitives/ui/menu';
import type { AdminOrganization } from '@/components/admin/types';

const PAGE_SIZE = 25;

const ROLE_BADGE: Record<string, string> = {
	owner: 'preset-filled-primary-50-950 border-primary-200-800',
	admin: 'preset-filled-warning-50-950 border-warning-200-800'
};

/**
 * Admin organizations management table. Lists every organization in the
 * deployment with a members view and force-delete. Only mounted when the
 * `organizations` feature toggle is enabled (enforced by {@link AdminDashboard}
 * and the server functions).
 */
export default function OrganizationsTable() {
	const { results, status, loadMore } = usePaginatedQuery(
		api.admin.queries.listAllOrganizations,
		{},
		{ initialNumItems: PAGE_SIZE }
	);
	const organizations = results ?? [];

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
			{status === 'LoadingFirstPage' ? (
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
								<tr key={org._id} className="!border-surface-300-700 !border-t">
									<td className="max-w-0 !py-3 !pl-3">
										<div className="flex items-center gap-2">
											<Avatar.Root className="size-8 shrink-0 sm:size-6">
												<Avatar.Image src={org.logo ?? undefined} alt={org.name} />
												<Avatar.Fallback>
													<Avatar.Marble name={org.name} />
												</Avatar.Fallback>
											</Avatar.Root>
											<div className="flex min-w-0 flex-col">
												<span className="truncate text-sm">{org.name}</span>
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
									<td className="text-right">
										<Menu.Root>
											<Menu.Trigger
												className="btn-icon hover:preset-tonal"
												aria-label={`Actions for ${org.name}`}
											>
												<EllipsisVertical className="size-4" aria-hidden="true" />
											</Menu.Trigger>
											<Menu.Content className="bg-surface-50-950">
												<Menu.Item value="members" onClick={() => openDialog(org, 'members')}>
													View members
												</Menu.Item>
												<Menu.Item
													value="delete"
													variant="destructive"
													onClick={() => openDialog(org, 'delete')}
												>
													Delete
												</Menu.Item>
											</Menu.Content>
										</Menu.Root>
									</td>
								</tr>
							))}
						</tbody>
					</table>
					{status === 'CanLoadMore' || status === 'LoadingMore' ? (
						<div className="flex justify-center py-3">
							<button
								type="button"
								className="btn preset-tonal"
								onClick={() => loadMore(PAGE_SIZE)}
								disabled={status === 'LoadingMore'}
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
					<div className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto">
						{!orgDetail ? (
							<div className="text-surface-600-400 flex items-center gap-2 text-sm" role="status">
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								Loading members...
							</div>
						) : orgDetail.members.length === 0 ? (
							<div className="text-surface-600-400 text-sm">No members.</div>
						) : (
							orgDetail.members.map((member) => (
								<div key={member._id} className="flex items-center gap-3">
									<Avatar.Root className="size-8 shrink-0">
										<Avatar.Image
											src={member.user?.image ?? undefined}
											alt={member.user?.name ?? ''}
										/>
										<Avatar.Fallback>
											<Avatar.Marble name={member.user?.name ?? '?'} />
										</Avatar.Fallback>
									</Avatar.Root>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-sm">{member.user?.name ?? 'Deleted user'}</span>
										<span className="text-surface-700-300 truncate text-xs">
											{member.user?.email}
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
								</div>
							))
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
