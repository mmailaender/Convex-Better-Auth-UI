import { Modal, ModalContent, ModalTrigger } from '@/components/primitives/ui/Modal';
import { useState } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';

export default function DeleteUser() {
	const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
	const deleteMutation = useAction(api.users.invalidateAndDeleteUser);
	const { signOut } = useAuthActions();

	async function handleConfirm() {
		try {
			await deleteMutation();
			await signOut();
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	function handleCancel() {
		setDeleteConfirmationOpen(false);
	}

	return (
		<Modal open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen} >
			<ModalTrigger className="btn preset-faded-surface-50-950 hover:bg-error-200-800 hover:text-error-950-50 h-10 w-full justify-between gap-1 text-sm">
				Delete account
			</ModalTrigger>
			<ModalContent>
				<div className="flex flex-col gap-2 md:w-80 w-full ">
				<header className="w-full py-2 pl-2 font-semibold">
				<p className="w-full font-semibold text-xl">Delete your account</p>
				</header>
				<article className='pb-4'>
					<p className='px-2 text-sm text-surface-700-300'>
						Are you sure you want to delete your account? All of your data will be permanently
						deleted.
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
				</div>
			</ModalContent>
		</Modal>
	);
}
