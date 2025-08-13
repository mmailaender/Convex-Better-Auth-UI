// React
import { useState, useMemo } from 'react';

/** UI Components **/
// Primitives
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Drawer from '@/components/primitives/ui/drawer';
import * as Avatar from '@/components/primitives/ui/avatar';
import { toast } from 'sonner';
// Icons
import { Search, Trash, Pencil } from 'lucide-react';

// API Convex
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
// API Types
type Member = typeof authClient.$Infer.Member;
type Role = Member['role'];

// Hooks
import { useRoles } from '@/components/organizations/api/hooks';
import { authClient } from '@/components/auth/api/auth-client';

/**
 * Component that displays a list of organization members with role management functionality
 */
export default function Members(): React.ReactNode {
	// State hooks
	const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState<Member | null>(null);

	// Get current organization data
	const activeUser = useQuery(api.users.queries.getActiveUser);
	const activeOrganization = useQuery(api.organizations.queries.getActiveOrganization);
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;

	// Get members data and mutations
	const members = activeOrganization?.members;

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
					owner: 0,
					admin: 1,
					member: 2
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
	const handleUpdateRole = async (memberId: string, newRole: Role): Promise<void> => {
		if (newRole === 'owner') return; // Cannot set someone as owner this way

		const { error } = await authClient.organization.updateMemberRole({
			role: [newRole],
			memberId
		});
		if (error) {
			toast.error(error.message);
		} else {
			toast.success('Role updated successfully!');
			setIsDrawerOpen(false);
		}
	};

	/**
	 * Handles removing a member from the organization
	 */
	const handleRemoveMember = async (): Promise<void> => {
		if (!selectedUserId || !activeOrganization?.id) return;

		const { error } = await authClient.organization.removeMember({
			memberIdOrEmail: selectedUserId,
			organizationId: activeOrganization.id
		});
		if (error) {
			toast.error(error.message);
		} else {
			toast.success('Member removed successfully!');
			setIsDialogOpen(false);
			setIsDrawerOpen(false);
		}
	};

	/**
	 * Check if current user can edit a member
	 */
	const canEditMember = (member: Member): boolean => {
		if (!isOwnerOrAdmin) return false;
		if (member.id === activeUser?.id) return false;
		if (member.role === 'owner') return false;

		// If current user is admin, they can't edit other admins
		if (activeUser && members) {
			const currentUserMember = members.find((m) => m.id === activeUser.id);
			if (currentUserMember?.role === 'admin' && member.role === 'admin') {
				return false;
			}
		}

		return true;
	};

	/**
	 * Handle member card click
	 */
	const handleMemberCardClick = (member: Member): void => {
		if (canEditMember(member)) {
			setSelectedMember(member);
			setIsDrawerOpen(true);
		}
	};

	if (!members) {
		return <div>Loading members...</div>;
	}

	if (!activeOrganization || !activeUser) {
		return <div>Failed to load members</div>;
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
						className="input w-hug w-full !border-0 border-transparent pl-8 text-sm"
						placeholder="Search members..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
					/>
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="block min-h-0 flex-1 sm:hidden">
				<div className="flex max-h-[calc(100vh-12rem)] flex-col gap-2 overflow-y-auto pb-24">
					{filteredMembers.map((member) => (
						<div
							key={member.id}
							className={`bg-surface-50-950 rounded-container flex items-center justify-between p-4 pr-6 ${
								canEditMember(member) ? 'hover:bg-surface-100-900 cursor-pointer' : ''
							}`}
							onClick={() => handleMemberCardClick(member)}
						>
							<div className="flex items-center space-x-3">
								<div className="avatar">
									<div className="size-10">
										<Avatar.Root className="size-10">
											<Avatar.Image src={member.user.image} alt={member.user.name} />
											<Avatar.Fallback>
												<Avatar.Marble name={member.user.name} />
											</Avatar.Fallback>
										</Avatar.Root>
									</div>
								</div>
								<div className="flex flex-col">
									<div className="flex items-center space-x-2">
										<span className="font-medium">{member.user.name}</span>
										{member.role === 'owner' && (
											<span className="badge preset-filled-primary-50-950 border-primary-200-800 h-6 border px-2">
												Owner
											</span>
										)}
										{member.role === 'admin' && (
											<span className="badge preset-filled-warning-50-950 border-warning-200-800 h-6 border px-2">
												Admin
											</span>
										)}
									</div>
									<span className="text-surface-700-300 text-sm">{member.user.email}</span>
								</div>
							</div>
							{canEditMember(member) && <Pencil className="size-4 opacity-60" />}
						</div>
					))}
				</div>
			</div>
			{/* Desktop Table Layout */}
			<div className="hidden min-h-0 flex-1 sm:block">
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
									<tr key={member.id} className="!border-surface-300-700 !border-t">
										{/* Member Name */}
										<td className="!w-48 !max-w-48 !truncate !py-3 !pl-0">
											<div className="flex items-center space-x-2">
												<div className="avatar">
													<div className="size-8 sm:size-5">
														<Avatar.Root className="size-8 sm:size-5">
															<Avatar.Image src={member.user.image} alt={member.user.name} />
															<Avatar.Fallback>
																<Avatar.Marble name={member.user.name} />
															</Avatar.Fallback>
														</Avatar.Root>
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
												member.id !== activeUser.id &&
												member.role !== 'owner' ? (
													<select
														value={member.role}
														onChange={(e) => handleUpdateRole(member.id, e.target.value as Role)}
														className="select cursor-pointer text-sm"
													>
														<option value="admin">Admin</option>
														<option value="member">Member</option>
													</select>
												) : member.role === 'owner' ? (
													<>
														<span className="badge preset-filled-primary-50-950 border-primary-200-800 h-6 border px-2">
															Owner
														</span>
													</>
												) : member.role === 'admin' ? (
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
										{/* Member Actions */}
										<td className="!w-16">
											<div className="flex justify-end space-x-2">
												{isOwnerOrAdmin &&
													member.id !== activeUser?.id &&
													member.role !== 'owner' && (
														<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
															<Dialog.Trigger
																className="btn-icon preset-filled-surface-200-800 hover:preset-filled-error-300-700"
																onClick={() => setSelectedUserId(member.id)}
															>
																<Trash className="size-4 opacity-70" />
															</Dialog.Trigger>
															<Dialog.Content className="md:max-w-108">
																<Dialog.Header className="flex-shrink-0">
																	<Dialog.Title>Remove member</Dialog.Title>
																</Dialog.Header>
																<article className="flex-shrink-0">
																	<p className="opacity-60">
																		Are you sure you want to remove the member {member.user.name}?
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
																		onClick={handleRemoveMember}
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
			</div>

			{/* Mobile Drawer */}
			<Drawer.Root open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<Drawer.Content>
					{selectedMember && (
						<>
							<Drawer.Header>
								<Drawer.Title>Edit Member</Drawer.Title>
							</Drawer.Header>
							<div className="">
								{/* Member Info */}
								<div className="flex items-center gap-3 pt-1 pb-8">
									<div className="avatar">
										<div className="size-12">
											{selectedMember.user.image ? (
												<Avatar.Root className="size-12">
													<Avatar.Image
														src={selectedMember.user.image}
														alt={selectedMember.user.name}
													/>
													<Avatar.Fallback>
														<Avatar.Marble name={selectedMember.user.name} />
													</Avatar.Fallback>
												</Avatar.Root>
											) : (
												<div className="text-primary-700 bg-primary-100 flex h-full w-full items-center justify-center rounded-full">
													{selectedMember.user.name?.charAt(0) || 'U'}
												</div>
											)}
										</div>
									</div>
									<div className="flex flex-col">
										<span>{selectedMember.user.name}</span>
										<p className="text-surface-700-300 text-sm">{selectedMember.user.email}</p>
									</div>
								</div>

								{/* Actions */}
								<div className="flex flex-col gap-3">
									{/* Role Select */}
									<div className="flex-1">
										<label>
											<span className="label">Role</span>
											<select
												value={selectedMember.role}
												onChange={(e) =>
													handleUpdateRole(selectedMember.id, e.target.value as Role)
												}
												className="select w-full"
											>
												<option value="admin">Admin</option>
												<option value="member">Member</option>
											</select>
										</label>
									</div>

									{/* Remove Button */}
									<div className="flex flex-col justify-end">
										<Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
											<Dialog.Trigger
												className="btn preset-filled-surface-300-700"
												onClick={() => setSelectedUserId(selectedMember.id)}
											>
												<Trash className="size-4" /> Remove
											</Dialog.Trigger>
											<Dialog.Content className="md:max-w-108">
												<Dialog.Header className="flex-shrink-0">
													<Dialog.Title>Remove member</Dialog.Title>
												</Dialog.Header>
												<Dialog.Description>
													Are you sure you want to remove the member {selectedMember.user.name}?
												</Dialog.Description>

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
														onClick={handleRemoveMember}
													>
														Confirm
													</button>
												</Dialog.Footer>
											</Dialog.Content>
										</Dialog.Root>
									</div>
								</div>
							</div>
						</>
					)}
				</Drawer.Content>
			</Drawer.Root>
		</div>
	);
}
