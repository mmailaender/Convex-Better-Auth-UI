import { useState, useMemo } from 'react';

// API
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Components
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
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
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successMessage, setSuccessMessage] = useState<string>('');
	const [selectedInvitationId, setSelectedInvitationId] = useState<Id<'invitations'> | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');

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
			await revokeInvitation({
				invitationId: selectedInvitationId
			});

			setErrorMessage('');
			setSuccessMessage('Invitation revoked successfully!');
		} catch (err) {
			setSuccessMessage('');
			setErrorMessage(
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
		<div>
			{errorMessage && <p className="text-error-500">{errorMessage}</p>}
			{successMessage && <p className="text-success-500">{successMessage}</p>}

			<div className="py-4 flex items-center gap-3">
				<div className="relative flex-1">
					<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center ">
						<Search className="text-surface-400-600 size-4" />
					</div>
					<input
						type="text"
						className="input w-full pl-6 border-0 w-hug text-sm"
						placeholder="Search invitations..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{filteredInvitations.length === 0 && searchQuery ? (
				<div className="text-surface-600-400 p-8 text-center">
					<p>No invitations match your search.</p>
				</div>
			) : (
				<table className="table caption-bottom">
					<thead className='bg-surface-300-700/50'>
						<tr>
												<th className="p-2 text-left text-xs  text-surface-700-300">Email</th>
							<th className="p-2 text-left text-xs  text-surface-700-300">Role</th>
							<th className="p-2 text-left text-xs  text-surface-700-300">Invited By</th>
							

							{isOwnerOrAdmin && <th className="p-2 text-right"></th>}
							
						</tr>
						
					</thead>
					<tbody>
						{filteredInvitations.map((invitation) => (
							<tr key={invitation._id} className="border-surface-300-700 border-b">
								<td className="">{invitation.email}</td>
								<td className="">
									<div className="flex items-center">
										{invitation.role === 'role_organization_owner' ? (
											<>
												<ShieldCheck className="text-primary-500 mr-1 size-4" />
												<span className="font-medium">Owner</span>
											</>
										) : invitation.role === 'role_organization_admin' ? (
											<>
												<Shield className="text-primary-400 mr-1 size-4" />
												<span className="font-medium">Admin</span>
											</>
										) : (
											<span>Member</span>
										)}
									</div>
								</td>
								<td className="p-2">{invitation.invitedBy.name}</td>
								<td className="text-right">
									{isOwnerOrAdmin && (
										<Dialog>
											<DialogTrigger
												className="btn btn-sm preset-filled-surface-300-700"
												onClick={() => setSelectedInvitationId(invitation._id)}
											>
												Revoke
											</DialogTrigger>
											<DialogContent className='w-full max-w-md'>
												<DialogClose />
												<DialogHeader>
													<DialogTitle>Revoke invitation</DialogTitle>
												</DialogHeader>
												<article>
													<p className="opacity-60">
														Are you sure you want to revoke the invitation sent to{' '}
														{invitation.email}?
													</p>
												</article>
												<DialogFooter>
													<DialogClose className="btn preset-tonal">Cancel</DialogClose>
													<button
														type="button"
														className="btn preset-filled-error-500"
														onClick={handleRevokeInvitation}
													>
														Confirm
													</button>
												</DialogFooter>
												{errorMessage && <p className="text-error-600-400">{errorMessage}</p>}
											</DialogContent>
										</Dialog>
									)}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}
