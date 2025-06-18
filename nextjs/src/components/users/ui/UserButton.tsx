'use client';

// React
import { ComponentProps, useState } from 'react';

// Primitive
import * as Popover from '@/components/primitives/ui/popover';
import * as Dialog from '@/components/primitives/ui/dialog';
import { Avatar } from '@skeletonlabs/skeleton-react';
// Icons
import { ChevronRight } from 'lucide-react';
// Components
import UserProfile from '@/components/users/ui/UserProfile';

// API
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery, Authenticated, Unauthenticated } from 'convex/react';
import { api } from '@/convex/_generated/api';
import SignIn from '@/components/auth/ui/SignIn';

// Types
type PopoverProps = ComponentProps<typeof Popover.Content>;

export default function UserButton({
	popoverSide = 'bottom',
	popoverAlign = 'end'
}: {
	/** Side the popover appears on relative to the trigger */
	popoverSide?: PopoverProps['side'];
	/** Alignment of the popover relative to the trigger */
	popoverAlign?: PopoverProps['align'];
}) {
	// Auth
	const { signOut } = useAuthActions();
	// Queries
	const user = useQuery(api.users.queries.getUser);

	// State
	const [userPopoverOpen, setUserPopoverOpen] = useState(false);
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);

	/**
	 * Open profile modal and close popover
	 */
	function openProfileModal(): void {
		setUserPopoverOpen(false);
		setProfileDialogOpen(true);
	}

	return (
		<>
			<Authenticated>
				{user ? (
					<>
						<Popover.Root open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
							<Popover.Trigger>
								<Avatar
									src={user.image}
									name={user.name}
									size="size-10 ring-0 hover:ring-4 ring-surface-100-900 ease-out duration-200"
								/>
							</Popover.Trigger>
							<Popover.Content side={popoverSide} align={popoverAlign}>
								<div className="flex flex-col gap-1 p-0">
									<button
										className="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex flex-row items-center gap-3 p-3 pr-6 duration-200 ease-in-out"
										onClick={openProfileModal}
									>
										<Avatar src={user.image} name={user.name} size="size-12" />
										<div className="flex flex-1 flex-col gap-0 overflow-hidden">
											<p className="truncate text-left text-base font-medium">{user.name}</p>
											<p className="text-surface-700-300 truncate text-left text-xs">
												{user.email}
											</p>
										</div>
										<ChevronRight className="size-4" />
									</button>
									<button
										className="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
										onClick={() => void signOut()}
									>
										Sign out
									</button>
								</div>
							</Popover.Content>
						</Popover.Root>

						{/* ProfileInfo Popup */}
						<Dialog.Root open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
							<Dialog.Content className="max-w-xl">
								<Dialog.Header>
									<Dialog.Title>Profile</Dialog.Title>
								</Dialog.Header>
								<UserProfile />
								<Dialog.CloseX />
							</Dialog.Content>
						</Dialog.Root>
					</>
				) : (
					<div className="placeholder-circle size-10 animate-pulse" />
				)}
			</Authenticated>
			<Unauthenticated>
				<Dialog.Root>
					<Dialog.Trigger className="btn preset-filled-primary-500">Sign in</Dialog.Trigger>
					<Dialog.Content className="sm:rounded-container h-full w-full rounded-none sm:h-auto sm:w-4xl sm:max-w-md">
						<Dialog.Header>
							<Dialog.Title>Sign in</Dialog.Title>
						</Dialog.Header>
						<SignIn />
						<Dialog.CloseX />
					</Dialog.Content>
				</Dialog.Root>
			</Unauthenticated>
		</>
	);
}
