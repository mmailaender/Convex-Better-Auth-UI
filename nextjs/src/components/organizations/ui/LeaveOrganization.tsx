import { useState } from 'react';

// API
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';
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

// Types
import { Id } from '@/convex/_generated/dataModel';

// Hooks
import { useIsOwner } from '@/components/organizations/api/hooks';

/**
 * LeaveOrganization component allows a user to leave the current organization
 * If the user is the owner, they must select a successor before leaving
 */
export default function LeaveOrganization(): React.ReactNode {
	// State hooks
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [isOpen, setIsOpen] = useState<boolean>(false);
	const [selectedSuccessor, setSelectedSuccessor] = useState<Id<'users'> | null>(null);

	// Convex queries and mutations
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const members = useQuery(api.organizations.members.getOrganizationMembers);
	const user = useQuery(api.users.getUser);
	const leaveOrganization = useMutation(api.organizations.members.leaveOrganization);

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
			setErrorMessage('As the organization owner, you must select a successor before leaving.');
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
			setErrorMessage('No active organization found.');
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
			setErrorMessage(
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
		<Dialog open={isOpen} onOpenChange={setIsOpen}>
			<DialogTrigger className="btn text-error-500 hover:bg-error-100 hover:text-error-600">
				Leave organization
			</DialogTrigger>

			<DialogContent>
				<DialogHeader>
					<DialogTitle>Leave organization</DialogTitle>
				</DialogHeader>

				<div className="space-y-4">
					<p>
						Are you sure you want to leave your organization? You will lose access to all projects
						and resources.
					</p>

					{isOrgOwner && (
						<>
							<div className="bg-warning-100 border-warning-300 rounded-md border p-3">
								<p className="text-warning-800 text-sm font-medium">
									As the organization owner, you must designate a successor before leaving.
								</p>
							</div>

							<div className="space-y-2">
								<label htmlFor="successor" className="text-surface-800-200 font-medium">
									Select a successor:
								</label>
								<select
									id="successor"
									value={selectedSuccessor?.toString() || ''}
									onChange={(e) =>
										setSelectedSuccessor(e.target.value ? (e.target.value as Id<'users'>) : null)
									}
									className="select w-full"
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

					{errorMessage && <p className="text-error-600-400">{errorMessage}</p>}

					<DialogFooter>
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
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	);
}
