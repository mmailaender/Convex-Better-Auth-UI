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
	DialogFooter
} from '@/components/primitives/ui/dialog';
import { Avatar } from '@skeletonlabs/skeleton-react';
import { Shield, ShieldCheck, Search, Trash } from 'lucide-react';

// Types
import { Doc, Id } from '@/convex/_generated/dataModel';
type Role = Doc<'organizationMembers'>['role'];

// Hooks
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import { toast } from '@/components/primitives/ui/sonner';

/**
 * Component that displays a list of organization members with role management functionality
 */
export function Members(): React.ReactNode {
	// State hooks
	const [selectedUserId, setSelectedUserId] = useState<Id<'users'> | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	// Get current organization data
	const currentUser = useQuery(api.users.getUser);
	const currentOrganization = useQuery(api.organizations.getActiveOrganization);
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	// Get members data and mutations
	const members = useQuery(api.organizations.members.getOrganizationMembers);
	const updateMemberRole = useMutation(api.organizations.members.updateMemberRole);
	const removeMember = useMutation(api.organizations.members.removeMember);

	/**
	 * Filter and sort members based on search query and role
	 */
	const filteredMembers = useMemo(() => {
		if (!members) return [];

		return members
			.filter((member) => {
				if (!searchQuery) return true;

				const memberName = member.user.name;
				return memberName.toLowerCase().includes(searchQuery.toLowerCase());
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

				// Secondary sort by name
				return a.user.name.localeCompare(b.user.name);
			});
	}, [members, searchQuery]);

	/**
	 * Handles updating a member's role
	 */
	const handleUpdateRole = async (userId: Id<'users'>, newRole: Role): Promise<void> => {
		if (newRole === 'role_organization_owner') return; // Cannot set someone as owner this way

		try {
			await updateMemberRole({
				userId,
				newRole
			});

			toast.success('Role updated successfully!');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to update role');
			console.error(err);
		}
	};

	/**
	 * Handles removing a member from the organization
	 */
	const handleRemoveMember = async (): Promise<void> => {
		if (!selectedUserId) return;

		try {
			await removeMember({
				userId: selectedUserId
			});

			toast.success('Member removed successfully!');
		} catch (err) {
			toast.error(
				err instanceof Error
					? err.message
					: 'Unknown error. Please try again. If it persists, contact support.'
			);
		}
	};

	if (!members) {
		return <div>Loading members...</div>;
	}

	if (!currentOrganization || !currentUser) {
		return <div>Failed to load members</div>;
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
						className="input w-hug w-full !border-0 border-transparent pl-6 text-sm"
						placeholder="Search members..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Table Section - Scrollable area */}
			<div className="min-h-0 flex-1">
				<div>
					{/* Table container with controlled height and scroll */}
					<div className="max-h-[calc(90vh-12rem)] overflow-y-auto pb-12 sm:max-h-[calc(80vh-12rem)] md:max-h-[calc(70vh-12rem)]">
						<table className="table w-full !table-fixed">
							<thead className="sm:bg-surface-200-800 bg-surface-100-900 border-surface-300-700 sticky top-0 z-20 border-b">
								<tr>
									<th className="text-surface-700-300 !w-48 p-2 !pl-0 text-left text-xs">Name</th>
									<th className="text-surface-700-300 hidden p-2 text-left text-xs sm:flex">
										Email
									</th>
									<th className="text-surface-700-300 !w-32 p-2 text-left text-xs">Role</th>
									{isOwnerOrAdmin && <th className="!w-16 p-2 text-right"></th>}
								</tr>
							</thead>
							<tbody>
								{filteredMembers.map((member) => (
									<tr key={member._id} className="!border-surface-300-700 !border-t">
										{/* Member Name */}
										<td className="!w-48 !max-w-48 !truncate !py-3 !pl-0">
											<div className="flex items-center space-x-2">
												<div className="avatar">
													<div className="size-8 sm:size-5">
														{member.user.image ? (
															<Avatar
																src={member.user.image}
																name={member.user.name}
																size="size-8 sm:size-5"
															/>
														) : (
															<div className="text-primary-700 flex h-full w-full items-center justify-center rounded-full">
																{member.user.name?.charAt(0) || 'U'}
															</div>
														)}
													</div>
												</div>

												<div className="flex flex-col truncate">
													<span className="truncate font-medium">{member.user.name}</span>
													{/* Email visible only on mobile (hidden on sm and above) */}
													<span className="text-surface-700-300 truncate text-xs sm:hidden">
														{member.user.email}
													</span>
												</div>
											</div>
										</td>
										{/* Member Email */}
										<td className="!text-surface-700-300 hidden !h-fit !w-full !truncate sm:table-cell">
											{member.user.email}
										</td>
										{/* Member Role */}
										<td className="!w-32">
											<div className="flex items-center">
												{isOwnerOrAdmin &&
												member.user._id !== currentUser._id &&
												member.role !== 'role_organization_owner' ? (
													<select
														value={member.role}
														onChange={(e) =>
															handleUpdateRole(member.user._id, e.target.value as Role)
														}
														className="select pl-1 text-sm"
													>
														<option value="role_organization_admin">Admin</option>
														<option value="role_organization_member">Member</option>
													</select>
												) : member.role === 'role_organization_owner' ? (
													<>
														<ShieldCheck className="text-primary-500 mr-1 size-4" />
														<span className="text-primary-900-100 font-medium">Owner</span>
													</>
												) : member.role === 'role_organization_admin' ? (
													<>
														<Shield className="text-primary-400 mr-1 size-4" />
														<span className="font-medium">Admin</span>
													</>
												) : (
													<span>Member</span>
												)}
											</div>
										</td>
										{/* Member Actions */}
										<td className="!w-16">
											<div className="flex justify-end space-x-2">
												{isOwnerOrAdmin &&
													member.user._id !== currentUser._id &&
													member.role !== 'role_organization_owner' && (
														<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
															<DialogTrigger
																className="btn-icon preset-filled-surface-200-800 hover:preset-filled-error-300-700"
																onClick={() => setSelectedUserId(member.user._id)}
															>
																<Trash size={16} opacity={0.7} />
															</DialogTrigger>
															<DialogContent className="flex max-h-[90vh] w-full max-w-md flex-col sm:max-h-[80vh] md:max-h-[70vh]">
																<DialogHeader className="flex-shrink-0">
																	<DialogTitle>Remove member</DialogTitle>
																</DialogHeader>
																<article className="flex-shrink-0">
																	<p className="opacity-60">
																		Are you sure you want to remove the member {member.user.name}?
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
																		onClick={handleRemoveMember}
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
			</div>
		</div>
	);
}
