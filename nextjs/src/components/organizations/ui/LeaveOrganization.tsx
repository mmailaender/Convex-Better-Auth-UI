import { useState } from 'react';

// Primitives
import * as Dialog from '@/components/primitives/ui/dialog';
import { toast } from 'sonner';

// API
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
import { api } from '@/convex/_generated/api';
import { useIsOwner } from '@/components/organizations/api/hooks';

// API Types
import { Id } from '@/convex/_generated/dataModel';

/**
 * LeaveOrganization component allows a user to leave the current organization
 * If the user is the owner, they must select a successor before leaving
 */
export default function LeaveOrganization(): React.ReactNode {
	// State hooks
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [selectedSuccessor, setSelectedSuccessor] = useState<Id<'users'> | null>(null);

	// Convex queries and mutations
	const activeOrganization = useQuery(api.organizations.queries.getActiveOrganization);
	const members = useQuery(api.organizations.members.queries.getOrganizationMembers);
	const user = useQuery(api.users.queries.getUser);
	const leaveOrganization = useMutation(api.organizations.members.mutations.leaveOrganization);

	// Navigation
	const router = useRouter();

	// Check if user is an organization owner
	const isOrgOwner = useIsOwner();

	// Get organization members excluding current user for successor selection
	const organizationMembers =
		members?.filter(
			(member) =>
				// Don't include the current user
				member.user._id !== user?._id
		) || [];

	/**
	 * Validates form input before submission
	 */
	const validateForm = (): boolean => {
		if (isOrgOwner && !selectedSuccessor) {
			toast.error('As the organization owner, you must select a successor before leaving.');
			return false;
		}
		return true;
	};

	/**
	 * Handles the leave organization action
	 */
	const handleLeaveOrganization = async (): Promise<void> => {
		if (!validateForm()) return;

		if (!activeOrganization?._id) {
			toast.error('No active organization found.');
			return;
		}

		try {
			await leaveOrganization({
				organizationId: activeOrganization._id,
				// Only send successorId if the user is an owner and a successor is selected
				...(isOrgOwner && selectedSuccessor ? { successorId: selectedSuccessor } : {})
			});

			setIsOpen(false);

			// Navigate to home page after leaving
			router.push('/');
			router.refresh();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to leave organization. Please try again.'
			);
			console.error(err);
		}
	};

	// Only show the component if there is an active organization with more than one member
	if (!activeOrganization || !members || members.length <= 1) {
		return null;
	}

	return (
		<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
			<Dialog.Trigger className="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 w-fit justify-between gap-1 text-sm">
				Leave organization
			</Dialog.Trigger>

			<Dialog.Content className="md:max-w-108">
				<Dialog.Header>
					<Dialog.Title>Leave organization</Dialog.Title>
				</Dialog.Header>
				<Dialog.Description>
					<p>If you leave organization you’ll lose access to all projects and resources.</p>
					{isOrgOwner && (
						<p className="my-6">As the owner, you must assign a new owner before leaving.</p>
					)}
				</Dialog.Description>
				{isOrgOwner && (
					<>
						<div className="space-y-2">
							<label htmlFor="successor" className="label">
								New owner:
							</label>
							<select
								id="successor"
								value={selectedSuccessor?.toString() || ''}
								onChange={(e) =>
									setSelectedSuccessor(e.target.value ? (e.target.value as Id<'users'>) : null)
								}
								className="select w-full cursor-pointer"
								required={isOrgOwner}
							>
								<option value="" disabled>
									Choose a successor
								</option>
								{organizationMembers.map((member) => (
									<option key={member.user._id.toString()} value={member.user._id.toString()}>
										{member.user.name} ({member.user.email})
									</option>
								))}
							</select>
						</div>
					</>
				)}

				<Dialog.Footer>
					<button className="btn preset-tonal" onClick={() => setIsOpen(false)}>
						Cancel
					</button>
					<button
						type="button"
						className="btn bg-error-500 hover:bg-error-600 text-white"
						onClick={handleLeaveOrganization}
						disabled={isOrgOwner && !selectedSuccessor}
					>
						Confirm
					</button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	);
}
