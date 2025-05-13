import { useState } from 'react';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';

// Components
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/primitives/ui/dialog';

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
		<Dialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
			<DialogTrigger className="btn preset-faded-surface-50-950 hover:bg-error-300-700 hover:text-error-950-50 h-10 w-full justify-between gap-1 text-sm rounded-lg">
				Delete account
			</DialogTrigger>
			<DialogContent>
				<div className="flex w-full flex-col gap-2	">
					<DialogHeader>
						<DialogTitle >Delete your account</DialogTitle>
					</DialogHeader>
					<article className="pb-4">
						<p className="text-surface-700-300 px-2 text-sm">
							Are you sure you want to delete your account? All of your data will be permanently
							deleted.
						</p>
					</article>
					<footer className="bg-surface-50-950 flex flex-row gap-2 rounded-xl p-2">
						<button type="button" className="btn preset-tonal w-full" onClick={handleCancel}>
							Cancel
						</button>
						<button
							type="button"
							className="btn preset-filled-error-500 w-full"
							onClick={handleConfirm}
						>
							Confirm
						</button>
					</footer>
				</div>
			</DialogContent>
		</Dialog>
	);
}
