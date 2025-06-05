import { useState } from 'react';

// API (Convex)
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';

// Components
import {
	Dialog,
	DialogTrigger,
	DialogTitle,
	DialogHeader,
	DialogDescription,
	DialogContent,
	DialogFooter
} from '@/components/primitives/ui/dialog';

export default function DeleteUser() {
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const deleteMutation = useAction(api.users.invalidateAndDeleteUser);
	const { signOut } = useAuthActions();

	/**
	 * Handle the delete confirmation action
	 */
	async function handleConfirm() {
		try {
			await deleteMutation();
			await signOut();
			setDeleteDialogOpen(false);
		} catch (error) {
			console.error('Error deleting user:', error);
		}
	}

	/**
	 * Handle cancellation of delete confirmation
	 */
	function handleCancel() {
		setDeleteDialogOpen(false);
	}

	return (
		<Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
			<DialogTrigger className="btn btn-sm preset-faded-surface-50-950 text-surface-600-400 hover:bg-error-300-700 hover:text-error-950-50 justify-between gap-1 rounded-lg text-sm">
				Delete account
			</DialogTrigger>
			<DialogContent className="md:max-w-108">
				<DialogHeader>
					<DialogTitle>Delete your account</DialogTitle>
					<DialogDescription className="text-surface-700-300">
						Are you sure you want to delete your account? All of your data will be permanently
						deleted.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter>
					<button type="button" className="btn preset-tonal" onClick={handleCancel}>
						Cancel
					</button>
					<button type="button" className="btn preset-filled-error-500" onClick={handleConfirm}>
						Confirm
					</button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
