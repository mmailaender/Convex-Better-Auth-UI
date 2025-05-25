'use client';

import { useState } from 'react';

// API
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

// Components
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogClose
} from '@/components/primitives/ui/dialog';

// Hooks
import { useIsOwner } from '@/components/organizations/api/hooks';

/**
 * Component for deleting an organization
 * Only available to organization owners
 */
export default function DeleteOrganization({
	onSuccessfulDelete,
	redirectTo
}: {
	/**
	 * Optional callback that will be called when an organization is successfully deleted
	 */
	onSuccessfulDelete?: () => void;
	/**
	 * Optional redirect URL after successful deletion
	 */
	redirectTo?: string;
}) {
	const [open, setOpen] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const router = useRouter();
	const activeOrganization = useQuery(api.organizations.getActiveOrganization);
	const isOwner = useIsOwner();

	const deleteOrganization = useMutation(api.organizations.deleteOrganization);

	if (!activeOrganization) {
		return null;
	}

	const handleConfirm = async (): Promise<void> => {
		try {
			await deleteOrganization({ organizationId: activeOrganization._id });
			setOpen(false);

			toast.success('Organization deleted successfully');

			if (onSuccessfulDelete) {
				onSuccessfulDelete();
			}

			if (redirectTo) {
				router.push(redirectTo);
			} else {
				router.push('/');
			}
		} catch (err) {
			if (err instanceof Error) {
				setError(err.message);
			} else {
				setError('Unknown error. Please try again. If it persists, contact support.');
			}
		}
	};

	const handleCancel = (): void => {
		setOpen(false);
	};

	// If user is not an owner, don't render anything
	if (!isOwner) {
		return null;
	}

	return (
		<Dialog open={open} onOpenChange={(open) => setOpen(open)}>
			<DialogTrigger className="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 w-fit justify-between gap-1 rounded-lg text-sm">
				Delete organization
			</DialogTrigger>

			<DialogContent className="w-[90%] max-w-md">
				<DialogHeader>
					<DialogTitle>Delete organization</DialogTitle>
				</DialogHeader>

				<article>
					<p className="text-surface-700-300 text-sm">
						Are you sure you want to delete the organization {activeOrganization.name}? All
						organization data will be permanently deleted.
					</p>
				</article>

				<DialogFooter>
					<button type="button" className="btn preset-tonal" onClick={handleCancel}>
						Cancel
					</button>
					<button type="button" className="btn preset-filled-error-500" onClick={handleConfirm}>
						Confirm
					</button>
				</DialogFooter>
				<DialogClose />

				{error && <p className="text-error-600-400 mt-2">{error}</p>}
			</DialogContent>
		</Dialog>
	);
}
