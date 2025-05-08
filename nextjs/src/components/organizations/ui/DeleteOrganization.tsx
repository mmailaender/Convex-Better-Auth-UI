'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import {
	Modal,
	ModalTrigger,
	ModalContent,
	ModalHeading,
	ModalClose
} from '@/components/primitives/ui/Modal';

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
		<Modal open={open} onOpenChange={(open) => setOpen(open)}>
			<ModalTrigger className="btn text-error-500 hover:preset-tonal-error-500">
				Delete organization
			</ModalTrigger>

			<ModalContent className='flex flex-col relative md:w-80 p-2 bg-surface-200-800 rounded-xl w-full gap-2'>
				<ModalClose />
				
				<header className="w-full py-2 pl-2 font-semibold">
				<p className="w-full font-semibold text-xl">Delete organization</p>
				</header>
				<article className='pb-8'>
					<p className='px-2 text-sm text-surface-700-300 '>
						Are you sure you want to delete the organization {activeOrganization.name}? All
						organization data will be permanently deleted.
					</p>
				</article>

				<footer className="bg-surface-50-950 p-2 rounded-xl flex flex-row gap-2">
					<button type="button" className="btn preset-tonal w-full" onClick={handleCancel}>
						Cancel
					</button>
					<button type="button" className="btn preset-filled-error-500 w-full" onClick={handleConfirm}>
						Confirm
					</button>
				</footer>

				{error && <p className="text-error-600-400 mt-2">{error}</p>}
			</ModalContent>
		</Modal>
	);
}
