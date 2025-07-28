import { useState, useMemo } from 'react';

// API
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRoles } from '@/components/organizations/api/hooks';

// Primitives
import * as Dialog from '@/components/primitives/ui/dialog';
import { toast } from 'sonner';
// Icons
import { Search } from 'lucide-react';

// Types
import { authClient } from '@/components/auth/lib/auth-client';
type Role = typeof authClient.$Infer.Member.role;

/**
 * Component that displays a list of organization invitations with revoke functionality
 */
export default function Invitations(): React.ReactNode {
	// State hooks
	const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Check if active user is an owner or admin
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;

	// Get invitations data
	const invitationList = useQuery(api.organizations.invitations.queries.listInvitations);

	/**
	 * Filter invitations based on search query and only show pending invitations
	 */
	const filteredInvitations = useMemo(() => {
		if (!invitationList) return [];

		return invitationList
			.filter((invitation) => {
				// Only show pending invitations
				if (invitation.status !== 'pending') return false;

				if (!searchQuery) return true;

				return invitation.email.toLowerCase().includes(searchQuery.toLowerCase());
			})
			.sort((a, b) => {
				// Sort by role (owner first, then admin, then member)
				const roleOrder: Record<Role, number> = {
					owner: 0,
					admin: 1,
					member: 2
				};

				// Primary sort by role
				const roleDiff = roleOrder[a.role as Role] - roleOrder[b.role as Role];
				if (roleDiff !== 0) return roleDiff;

				// Secondary sort by email
				return a.email.localeCompare(b.email);
			});
	}, [invitationList, searchQuery]);

	/**
	 * Handles revoking an invitation
	 */
	const handleRevokeInvitation = async (): Promise<void> => {
		if (!selectedInvitationId) return;

		const { error } = await authClient.organization.cancelInvitation({
			invitationId: selectedInvitationId
		});

		if (error) {
			toast.error(error.message);
			return;
		} else {
			toast.success('Invitation revoked successfully');
			setIsDialogOpen(false);
		}
	};

	if (!invitationList) {
		return <div>Loading invitations...</div>;
	}

	if (filteredInvitations.length === 0 && !searchQuery) {
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
					<div className="pointer-events-none absolute inset-y-0 flex items-center pl-2">
						<Search className="text-surface-400-600 size-4" />
					</div>
					<input
						type="text"
						className="input w-hug w-full !border-0 !border-transparent pl-8 text-sm"
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
										<th className="text-surface-700-300 w-64 truncate p-2 !pl-0 text-left text-xs">
											User
										</th>
										<th className="text-surface-700-300 w-32 p-2 !pl-0 text-left text-xs">
											Expires
										</th>
										<th className="text-surface-700-300 hidden w-32 p-2 text-left text-xs sm:table-cell">
											Role
										</th>
										{isOwnerOrAdmin && <th className="w-20 p-2 text-right"></th>}
									</tr>
								</thead>
								<tbody>
									{filteredInvitations.map((invitation) => (
										<tr key={invitation.id} className="!border-surface-300-700 !border-t">
											{/* User */}
											<td className="!w-64 !max-w-64 !truncate !py-3 !pl-0">
												<span className="truncate font-medium">{invitation.email}</span>
											</td>
											{/* Expires */}
											<td className="!w-64 !max-w-64 !truncate !py-3 !pl-0">
												<span className="truncate font-medium">
													{new Date(invitation.expiresAt).toLocaleDateString()}
												</span>
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
											{/* Actions */}
											<td className="!w-20">
												<div className="flex justify-end">
													{isOwnerOrAdmin && (
														<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
															<Dialog.Trigger
																className="btn btn-sm preset-filled-surface-300-700"
																onClick={() => setSelectedInvitationId(invitation.id)}
															>
																Revoke
															</Dialog.Trigger>
															<Dialog.Content className="md:max-w-108">
																<Dialog.Header className="flex-shrink-0">
																	<Dialog.Title>Revoke invitation</Dialog.Title>
																</Dialog.Header>
																<article className="flex-shrink-0">
																	<p className="opacity-60">
																		Are you sure you want to revoke the invitation sent to{' '}
																		{invitation.email}?
																	</p>
																</article>
																<Dialog.Footer className="flex-shrink-0">
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
																</Dialog.Footer>
															</Dialog.Content>
														</Dialog.Root>
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
