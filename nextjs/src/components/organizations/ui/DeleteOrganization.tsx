'use client';

// React
import { useState } from 'react';

/** UI **/
// Primitives
import { toast } from 'sonner';
import * as Dialog from '@/components/primitives/ui/dialog';
import { Loader2 } from 'lucide-react';

// API
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useRoles } from '@/components/organizations/api/hooks';
import { ConvexError } from 'convex/values';
import { useActiveOrganizationData } from '@/lib/auth/hooks';

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
	const [isDeleting, setIsDeleting] = useState<boolean>(false);
	const router = useRouter();
	const activeOrganization = useActiveOrganizationData();
	const deleteOrganization = useMutation(api.organizations.mutations.deleteOrganization);
	const isOwner = useRoles().hasOwnerRole;

	if (!activeOrganization) {
		return null;
	}

	const handleConfirm = async (): Promise<void> => {
		setIsDeleting(true);
		try {
			await deleteOrganization({ organizationId: activeOrganization.id });

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
		} catch (error) {
			if (error instanceof ConvexError) {
				toast.error(error.data);
				return;
			}
			toast.error('Failed to delete organization');
			return;
		} finally {
			setIsDeleting(false);
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
					<div className="text-surface-700-300 space-y-3 text-sm">
						<p>Are you sure you want to delete this organization?</p>
						<div className="bg-surface-200-800 border-surface-200-800 rounded-container border p-3 text-center">
							<span className="text-surface-800-200 font-semibold">{activeOrganization.name}</span>
						</div>
						<p>All organization data will be permanently deleted and cannot be recovered.</p>
					</div>
				</article>

				<Dialog.Footer className="w-full">
					<Dialog.Close className="btn preset-tonal" disabled={isDeleting}>
						Cancel
					</Dialog.Close>
					<button
						type="button"
						className="btn preset-filled-error-500"
						onClick={handleConfirm}
						disabled={isDeleting}
						aria-busy={isDeleting}
					>
						{isDeleting ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
								Deleting...
							</>
						) : (
							'Delete'
						)}
					</button>
				</Dialog.Footer>
			</Dialog.Content>
		</Dialog.Root>
	);
}
