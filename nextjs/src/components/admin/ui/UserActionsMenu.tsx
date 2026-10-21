'use client';

import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import {
	Ban,
	CircleUser,
	Copy,
	EllipsisVertical,
	KeyRound,
	LockOpen,
	LogOut,
	ShieldCheck,
	ShieldOff,
	Trash2,
	VenetianMask
} from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Menu from '@/components/primitives/ui/menu';
import { Portal } from '@ark-ui/react/portal';
import { authClient } from '@/lib/auth/api/auth-client';
import type { AdminUser, UserDialog } from '@/components/admin/types';

type UserActionsMenuProps = {
	user: AdminUser;
	/** Whether `user` is the signed-in admin, who can't act on their own account here */
	isSelf: boolean;
	/** Opens one of the dialogs of `UserDialogs` */
	onDialog: (dialog: UserDialog) => void;
	/** Shows "View profile" when set */
	onViewProfile?: () => void;
};

/**
 * The actions menu of a user, in the users table and on the user profile. Actions without a
 * form run right away; the others open a dialog of {@link UserDialogs} through `onDialog`.
 */
export default function UserActionsMenu({
	user,
	isSelf,
	onDialog,
	onViewProfile
}: UserActionsMenuProps) {
	const setRole = useMutation(api.admin.mutations.setRole);
	const unbanUser = useMutation(api.admin.mutations.unbanUser);
	const revokeUserSessions = useMutation(api.admin.mutations.revokeUserSessions);

	// The server refuses the rest for these users too: see `assertCanManageUser`
	const canManage = !isSelf && !user.isBootstrapAdmin;

	async function run(action: () => Promise<unknown>, success: string, failure: string) {
		try {
			await action();
			toast.success(success);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : failure);
		}
	}

	async function impersonate() {
		const { error } = await authClient.admin.impersonateUser({ userId: user.id });
		if (error) {
			toast.error(error.message ?? 'Failed to impersonate user');
			return;
		}
		// Refresh the Convex JWT cookie the server renders with, then reload so every query
		// runs as the impersonated user
		await authClient.getSession();
		// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a client-side navigation would keep the admin's session state
		window.location.assign('/');
	}

	return (
		<Menu.Root>
			<Menu.Trigger className="btn-icon hover:preset-tonal" aria-label={`Actions for ${user.name}`}>
				<EllipsisVertical className="size-4" aria-hidden="true" />
			</Menu.Trigger>
			{/* Portaled so the table's scroll container doesn't clip the menu */}
			<Portal>
				<Menu.Content className="bg-surface-50-950 min-w-52">
					<Menu.Item
						value="copy-id"
						className="gap-3"
						onClick={() =>
							run(
								() => navigator.clipboard.writeText(user.id),
								'Copied the user ID',
								"Couldn't copy"
							)
						}
					>
						<Copy className="size-4" aria-hidden="true" />
						Copy user ID
					</Menu.Item>
					{onViewProfile ? (
						<Menu.Item value="profile" className="gap-3" onClick={onViewProfile}>
							<CircleUser className="size-4" aria-hidden="true" />
							View profile
						</Menu.Item>
					) : null}
					{canManage && user.isAppAdmin ? (
						<>
							<Menu.Separator />
							<Menu.Item
								value="remove-admin"
								className="gap-3"
								onClick={() =>
									run(
										() => setRole({ userId: user.id, role: 'user' }),
										`${user.name} is no longer an admin`,
										'Failed to remove the admin role'
									)
								}
							>
								<ShieldOff className="size-4" aria-hidden="true" />
								Remove admin
							</Menu.Item>
						</>
					) : canManage ? (
						<>
							{!user.banned ? (
								<Menu.Item value="impersonate" className="gap-3" onClick={impersonate}>
									<VenetianMask className="size-4" aria-hidden="true" />
									Impersonate
								</Menu.Item>
							) : null}
							<Menu.Separator />
							<Menu.Item
								value="make-admin"
								className="gap-3"
								onClick={() => onDialog('make-admin')}
							>
								<ShieldCheck className="size-4" aria-hidden="true" />
								Make admin
							</Menu.Item>
							<Menu.Item value="password" className="gap-3" onClick={() => onDialog('password')}>
								<KeyRound className="size-4" aria-hidden="true" />
								Set password
							</Menu.Item>
							<Menu.Item
								value="revoke"
								className="gap-3"
								onClick={() =>
									run(
										() => revokeUserSessions({ userId: user.id }),
										`Signed ${user.name} out everywhere`,
										'Failed to revoke sessions'
									)
								}
							>
								<LogOut className="size-4" aria-hidden="true" />
								Sign out everywhere
							</Menu.Item>
							<Menu.Separator />
							{user.banned ? (
								<Menu.Item
									value="unban"
									className="gap-3"
									onClick={() =>
										run(
											() => unbanUser({ userId: user.id }),
											`Unbanned ${user.name}`,
											'Failed to unban user'
										)
									}
								>
									<LockOpen className="size-4" aria-hidden="true" />
									Unban
								</Menu.Item>
							) : (
								<Menu.Item
									value="ban"
									variant="destructive"
									className="gap-3"
									onClick={() => onDialog('ban')}
								>
									<Ban className="size-4" aria-hidden="true" />
									Ban
								</Menu.Item>
							)}
							<Menu.Item
								value="delete"
								variant="destructive"
								className="gap-3"
								onClick={() => onDialog('delete')}
							>
								<Trash2 className="size-4" aria-hidden="true" />
								Delete user
							</Menu.Item>
						</>
					) : null}
				</Menu.Content>
			</Portal>
		</Menu.Root>
	);
}
