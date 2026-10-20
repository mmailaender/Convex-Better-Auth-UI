'use client';

import { useId, useState } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Password from '@/components/primitives/ui/password';
import type { AdminUser, UserDialog } from '@/components/admin/types';

const BAN_DURATIONS = [
	{ label: 'Permanent', value: '' },
	{ label: '1 hour', value: String(60 * 60) },
	{ label: '1 day', value: String(60 * 60 * 24) },
	{ label: '7 days', value: String(60 * 60 * 24 * 7) },
	{ label: '30 days', value: String(60 * 60 * 24 * 30) }
];

type UserDialogsProps = {
	/** The user the open dialog acts on */
	user: AdminUser | null;
	/** The open dialog, if any */
	dialog: UserDialog | null;
	onDialogChange: (dialog: UserDialog | null) => void;
	/** Called after the user is deleted */
	onDeleted?: () => void;
};

/**
 * The dialogs of the user actions: make admin, ban, set password and delete. Opened from
 * {@link UserActionsMenu} in the users table and on the user profile.
 */
export default function UserDialogs({ user, dialog, onDialogChange, onDeleted }: UserDialogsProps) {
	const setRole = useMutation(api.admin.mutations.setRole);
	const banUser = useMutation(api.admin.mutations.banUser);
	const removeUser = useMutation(api.admin.mutations.removeUser);
	const setUserPassword = useMutation(api.admin.mutations.setUserPassword);

	const [banReason, setBanReason] = useState('');
	const [banExpiresIn, setBanExpiresIn] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);
	// The users table stays mounted behind a profile, so both render these dialogs: per-instance
	// ids keep each submit button's `form` pointing at its own form
	const formId = useId();
	const banFormId = `${formId}-ban`;
	const passwordFormId = `${formId}-password`;

	// Each dialog opens with empty fields
	const [shownDialog, setShownDialog] = useState(dialog);
	if (dialog !== shownDialog) {
		setShownDialog(dialog);
		if (dialog) {
			setBanReason('');
			setBanExpiresIn('');
			setNewPassword('');
		}
	}

	function rootProps(name: UserDialog) {
		return {
			open: dialog === name,
			lazyMount: true,
			unmountOnExit: true,
			onOpenChange: (open: boolean) => {
				if (!open && dialog === name) onDialogChange(null);
			}
		};
	}

	async function submit(action: () => Promise<unknown>, success: string, failure: string) {
		setSubmitting(true);
		try {
			await action();
			toast.success(success);
			return true;
		} catch (error) {
			toast.error(error instanceof Error ? error.message : failure);
			return false;
		} finally {
			setSubmitting(false);
		}
	}

	async function handleBanSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!user) return;
		const done = await submit(
			() =>
				banUser({
					userId: user.id,
					banReason: banReason.trim() || undefined,
					banExpiresIn: banExpiresIn ? Number(banExpiresIn) : undefined
				}),
			`Banned ${user.name}`,
			'Failed to ban user'
		);
		if (done) onDialogChange(null);
	}

	async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!user) return;
		const done = await submit(
			() => setUserPassword({ userId: user.id, newPassword }),
			`Updated the password of ${user.name}`,
			'Failed to set password'
		);
		if (done) onDialogChange(null);
	}

	async function handleMakeAdmin() {
		if (!user) return;
		const done = await submit(
			() => setRole({ userId: user.id, role: 'admin' }),
			`${user.name} is now an admin`,
			'Failed to make admin'
		);
		if (done) onDialogChange(null);
	}

	async function handleDelete() {
		if (!user) return;
		const done = await submit(
			() => removeUser({ userId: user.id }),
			`Deleted ${user.name}`,
			'Failed to delete user'
		);
		if (done) {
			onDialogChange(null);
			onDeleted?.();
		}
	}

	const submitLabel = (idle: string, busy: string) =>
		submitting ? (
			<>
				<Loader2 className="size-4 animate-spin" aria-hidden="true" />
				{busy}
			</>
		) : (
			idle
		);

	return (
		<>
			{/* Make admin dialog */}
			<Dialog.Root {...rootProps('make-admin')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Make {user?.name} an admin?</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							Admins can see and change every user and organization, and sign in as any user who
							isn&apos;t an admin. You can remove the role again at any time.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="button"
							className="btn preset-filled-primary-500"
							onClick={handleMakeAdmin}
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Make admin', 'Saving...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Ban dialog */}
			<Dialog.Root {...rootProps('ban')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Ban {user?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							They are signed out everywhere and can&apos;t sign in until the ban ends or you lift
							it.
						</Dialog.Description>
					</Dialog.Header>
					<form id={banFormId} className="flex w-full flex-col gap-3" onSubmit={handleBanSubmit}>
						<label className="label">
							<span className="label-text">Reason (optional)</span>
							<input
								type="text"
								className="input"
								value={banReason}
								onChange={(e) => setBanReason(e.target.value)}
								placeholder="Violation of terms"
							/>
						</label>
						<label className="label">
							<span className="label-text">Duration</span>
							<select
								className="select"
								value={banExpiresIn}
								onChange={(e) => setBanExpiresIn(e.target.value)}
							>
								{BAN_DURATIONS.map((duration) => (
									<option key={duration.value} value={duration.value}>
										{duration.label}
									</option>
								))}
							</select>
						</label>
					</form>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="submit"
							form={banFormId}
							className="btn preset-filled-error-500"
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Ban user', 'Banning...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Set password dialog */}
			<Dialog.Root {...rootProps('password')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Set password for {user?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							If they sign in without a password today, they can also use their email and this
							password from now on. Their existing sessions stay signed in.
						</Dialog.Description>
					</Dialog.Header>
					<form id={passwordFormId} className="w-full" onSubmit={handlePasswordSubmit}>
						<label className="label">
							<span className="label-text">New password</span>
							<Password.Root minScore={0}>
								<Password.Input
									value={newPassword}
									onChange={(e) => setNewPassword(e.currentTarget.value)}
									autoComplete="new-password"
									minLength={8}
									required
								>
									<Password.ToggleVisibility />
								</Password.Input>
							</Password.Root>
						</label>
					</form>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="submit"
							form={passwordFormId}
							className="btn preset-filled-primary-500"
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Set password', 'Saving...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			{/* Delete dialog */}
			<Dialog.Root {...rootProps('delete')}>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Delete {user?.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							This permanently deletes the account, its sessions and its organization memberships.
							If they own an organization with other members, delete it or make someone else its
							owner first. This can&apos;t be undone.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={submitting}>
							Cancel
						</Dialog.Close>
						<button
							type="button"
							className="btn preset-filled-error-500"
							onClick={handleDelete}
							disabled={submitting}
							aria-busy={submitting}
						>
							{submitLabel('Delete user', 'Deleting...')}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</>
	);
}
