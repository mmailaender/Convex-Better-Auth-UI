import { useState } from 'react';

// Primitives
import * as Dialog from '@/components/primitives/ui/dialog';
import { toast } from 'sonner';

// API
import { ConvexError } from 'convex/values';
import { authClient } from '@/components/auth/lib/auth-client';

export default function DeleteUser() {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	/**
	 * Handle the delete confirmation action
	 */
	async function handleConfirm() {
		try {
			await authClient.deleteUser();
			await authClient.signOut();
			setDeleteDialogOpen(false);
		} catch (error) {
			console.error('Error deleting user:', error);
			if (error instanceof ConvexError) {
				toast.error(error.data);
			} else if (error instanceof Error) {
				toast.error(error.message);
			} else {
				toast.error('Error deleting user');
			}
		}
	}

	return (
		<Dialog.Root open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
			<Dialog.Trigger className="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 rounded-base justify-between gap-1 text-sm">
				Delete account
			</Dialog.Trigger>
			<Dialog.Content className="md:max-w-108">
				<Dialog.Header>
					<Dialog.Title>Delete your account</Dialog.Title>
					<Dialog.Description className="text-surface-700-300">
						Are you sure you want to delete your account? All of your data will be permanently
						deleted.
					</Dialog.Description>
				</Dialog.Header>

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
