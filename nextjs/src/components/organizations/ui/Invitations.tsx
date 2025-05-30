import { useState, useMemo } from 'react';

// API
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from '@/components/primitives/ui/sonner';

// Components
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter
} from '@/components/primitives/ui/dialog';
import { Shield, ShieldCheck, Search } from 'lucide-react';

// Types
import { Doc, Id } from '@/convex/_generated/dataModel';
type Role = Doc<'organizationMembers'>['role'];

// Hooks
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';

/**
 * Component that displays a list of organization invitations with revoke functionality
 */
export function Invitations(): React.ReactNode {
	// State hooks
	const [selectedInvitationId, setSelectedInvitationId] = useState<Id<'invitations'> | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Check if current user is an owner or admin
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	// Get invitations data and mutations
	const invitations = useQuery(api.organizations.invitations.db.getInvitations);
	const revokeInvitation = useMutation(api.organizations.invitations.db.revokeInvitation);

	/**
	 * Filter invitations based on search query
	 */
	const filteredInvitations = useMemo(() => {
		if (!invitations) return [];

		return invitations
			.filter((invitation) => {
				if (!searchQuery) return true;

				return invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
			})
			.sort((a, b) => {
				// Sort by role (owner first, then admin, then member)
				const roleOrder: Record<Role, number> = {
					role_organization_owner: 0,
					role_organization_admin: 1,
					role_organization_member: 2
				};

				// Primary sort by role
				const roleDiff = roleOrder[a.role] - roleOrder[b.role];
				if (roleDiff !== 0) return roleDiff;

				// Secondary sort by email
				return a.email.localeCompare(b.email);
			});
	}, [invitations, searchQuery]);

	/**
	 * Handles revoking an invitation
	 */
	const handleRevokeInvitation = async (): Promise<void> => {
		if (!selectedInvitationId) return;

		try {
			await revokeInvitation({ invitationId: selectedInvitationId });
			toast.success('Invitation revoked successfully');
			setIsDialogOpen(false);
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Unknown error. Please try again. If it persists, contact support.'
			);
		}
	};

	if (!invitations) {
		return <div>Loading invitations...</div>;
	}

	if (invitations.length === 0 && !searchQuery) {
		return (
			<div className="text-surface-600-400 p-8 text-center">
				<p>No pending invitations.</p>
			</div>
		);
	}

	return (
		<div className="flex h-full flex-col">
			{/* Search Section - Fixed at top */}
			<div className="flex flex-shrink-0 items-center gap-3 py-4">
				<div className="relative flex-1">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center">
						<Search className="text-surface-400-600 size-4" />
					</div>
					<input
						type="text"
						className="input w-hug w-full !border-0 !border-transparent pl-6 text-sm"
						placeholder="Search invitations..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Table Section - Scrollable area */}
			<div className="min-h-0 flex-1">
				{filteredInvitations.length === 0 && searchQuery ? (
					<div className="text-surface-600-400 p-8 text-center">
						<p>No invitations match your search.</p>
					</div>
				) : (
					<div>
						{/* Table container with controlled height and scroll */}
						<div className="max-h-[calc(90vh-12rem)] overflow-y-auto pb-12 sm:max-h-[calc(80vh-12rem)] md:max-h-[calc(70vh-12rem)]">
							<table className="table w-full !table-fixed">
								<thead className="sm:bg-surface-200-800 bg-surface-100-900 border-surface-300-700 sticky top-0 z-20 border-b">
									<tr>
										<th className="text-surface-700-300 !w-64 p-2 !pl-0 text-left text-xs">
											Email
										</th>
										<th className="text-surface-700-300 hidden !w-32 p-2 text-left text-xs sm:table-cell">
											Role
										</th>
										<th className="text-surface-700-300 hidden !w-24 p-2 text-left text-xs sm:table-cell">
											Invited By
										</th>
										{isOwnerOrAdmin && <th className="!w-20 p-2 text-right"></th>}
									</tr>
								</thead>
								<tbody>
									{filteredInvitations.map((invitation) => (
										<tr key={invitation._id} className="!border-surface-300-700 !border-t">
											{/* Email */}
											<td className="!w-64 !max-w-64 !truncate !py-3 !pl-0">
												<span className="truncate font-medium">{invitation.email}</span>
											</td>
											{/* Role */}
											<td className="!text-surface-700-300 hidden !w-32 sm:table-cell">
												<div className="flex items-center">
													{invitation.role === 'role_organization_owner' ? (
														<>
															<span className="badge preset-filled-primary-50-950 border-primary-200-800 h-6 border px-2">
																Owner
															</span>
														</>
													) : invitation.role === 'role_organization_admin' ? (
														<>
															<span className="badge preset-filled-warning-50-950 border-warning-200-800 h-6 border px-2">
																Admin
															</span>
														</>
													) : (
														<span className="badge preset-filled-surface-300-700 border-surface-400-600 h-6 border px-2">
															Member
														</span>
													)}
												</div>
											</td>
											{/* Invited By */}
											<td className="!text-surface-700-300 hidden !h-fit !w-24 !truncate sm:table-cell">
												{invitation.invitedBy.name}
											</td>
											{/* Actions */}
											<td className="!w-20">
												<div className="flex justify-end">
													{isOwnerOrAdmin && (
														<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
															<DialogTrigger
																className="btn btn-sm preset-filled-surface-300-700"
																onClick={() => setSelectedInvitationId(invitation._id)}
															>
																Revoke
															</DialogTrigger>
															<DialogContent className="md:max-w-108">
																<DialogHeader className="flex-shrink-0">
																	<DialogTitle>Revoke invitation</DialogTitle>
																</DialogHeader>
																<article className="flex-shrink-0">
																	<p className="opacity-60">
																		Are you sure you want to revoke the invitation sent to{' '}
																		{invitation.email}?
																	</p>
																</article>
																<DialogFooter className="flex-shrink-0">
																	<button
																		type="button"
																		className="btn preset-tonal"
																		onClick={() => setIsDialogOpen(false)}
																	>
																		Cancel
																	</button>
																	<button
																		type="button"
																		className="btn preset-filled-error-500"
																		onClick={handleRevokeInvitation}
																	>
																		Confirm
																	</button>
																</DialogFooter>
															</DialogContent>
														</Dialog>
													)}
												</div>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
