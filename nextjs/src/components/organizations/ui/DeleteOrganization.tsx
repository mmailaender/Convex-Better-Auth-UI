'use client';

// React
import { useState } from 'react';

/** UI **/
// Primitives
import { toast } from 'sonner';
import * as Dialog from '@/components/primitives/ui/dialog';

// API
import { useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRoles } from '@/components/organizations/api/hooks';
import { authClient } from '@/components/auth/lib/auth-client';

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
	const router = useRouter();
	const activeOrganization = useQuery(api.organizations.queries.getActiveOrganization);
	const isOwner = useRoles().hasOwnerRole;

	if (!activeOrganization) {
		return null;
	}

	const handleConfirm = async (): Promise<void> => {
		console.log('activeOrganization.id', activeOrganization.id);
		const { data, error } = await authClient.organization.delete({
			organizationId: activeOrganization.id
		});
		console.log('data', data);
		console.log('error', error);
		if (error) {
			toast.error(error.statusText);
			return;
		}
		setOpen(false);

		toast.success('Organization deleted successfully');

		// Call the onSuccessfulDelete callback if provided
		if (onSuccessfulDelete) {
			onSuccessfulDelete();
		}

		// Navigate to the specified URL or home by default
		if (redirectTo) {
			router.push(redirectTo);
		} else {
			router.push('/');
		}
	};

	// If user is not an owner, don't render anything
	if (!isOwner) {
		return null;
	}

	return (
		<Dialog.Root open={open} onOpenChange={(open) => setOpen(open)}>
			<Dialog.Trigger className="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 w-fit justify-between gap-1 text-sm">
				Delete organization
			</Dialog.Trigger>

			<Dialog.Content className="w-[90%] max-w-md">
				<Dialog.Header>
					<Dialog.Title>Delete organization</Dialog.Title>
				</Dialog.Header>

				<article>
					<p className="text-surface-700-300 text-sm">
						Are you sure you want to delete the organization {activeOrganization.name}? All
						organization data will be permanently deleted.
					</p>
				</article>

				<Dialog.Footer>
					<Dialog.Close className="btn preset-tonal">Cancel</Dialog.Close>
					<button type="button" className="btn preset-filled-error-500" onClick={handleConfirm}>
						Confirm
					</button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	);
}
