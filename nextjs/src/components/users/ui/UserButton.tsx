'use client';

// React
import { ComponentProps, useState } from 'react';

// Primitive
import * as Popover from '@/components/primitives/ui/popover';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Avatar from '@/components/primitives/ui/avatar';
// Icons
import { ChevronRight } from 'lucide-react';
// Components
import UserProfile from '@/components/users/ui/UserProfile';
import SignIn from '@/components/auth/ui/SignIn';

// API
import { Authenticated, Unauthenticated, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import SignOutButton from '@/components/auth/ui/SignOutButton';

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
	// Queries
	const user = useQuery(api.users.queries.getActiveUser);

	// State
	const [userPopoverOpen, setUserPopoverOpen] = useState(false);
	const [profileDialogOpen, setProfileDialogOpen] = useState(false);
	const [signInDialogOpen, setSignInDialogOpen] = useState(false);

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
								<Avatar.Root className="ring-surface-100-900 size-10 ring-0 duration-200 ease-out hover:ring-4">
									<Avatar.Image src={user.image as string | undefined} alt={user.name} />
									<Avatar.Fallback>
										<Avatar.Marble name={user.name} />
									</Avatar.Fallback>
								</Avatar.Root>
							</Popover.Trigger>
							<Popover.Content side={popoverSide} align={popoverAlign}>
								<div className="flex flex-col gap-1 p-0">
									<button
										className="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex flex-row items-center gap-3 p-3 pr-6 duration-200 ease-in-out"
										onClick={openProfileModal}
									>
										<Avatar.Root className="size-12">
											<Avatar.Image src={user.image as string | undefined} alt={user.name} />
											<Avatar.Fallback>
												<Avatar.Marble name={user.name} />
											</Avatar.Fallback>
										</Avatar.Root>
										<div className="flex flex-1 flex-col gap-0 overflow-hidden">
											<p className="truncate text-left text-base font-medium">{user.name}</p>
											<p className="text-surface-700-300 truncate text-left text-xs">
												{user.email}
											</p>
										</div>
										<ChevronRight className="size-4" />
									</button>
									<SignOutButton onSuccess={() => setUserPopoverOpen(false)} />
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
				<Dialog.Root open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
					<Dialog.Trigger className="btn preset-filled-primary-500">Sign in</Dialog.Trigger>
					<Dialog.Content className="sm:rounded-container h-full w-full rounded-none sm:h-auto sm:w-4xl sm:max-w-md">
						<Dialog.Header>
							<Dialog.Title>Sign in</Dialog.Title>
						</Dialog.Header>
						<SignIn onSignIn={() => setSignInDialogOpen(false)} />
						<Dialog.CloseX />
					</Dialog.Content>
				</Dialog.Root>
			</Unauthenticated>
		</>
	);
}
