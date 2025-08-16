'use client';

// React
import { ComponentProps, useState } from 'react';

// Primitives
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
							<Dialog.Content className="md:rounded-container top-0 left-0 h-full max-h-full w-full max-w-full translate-x-0 translate-y-0 rounded-none md:top-[50%] md:left-[50%] md:h-auto md:max-h-[80vh] md:w-auto md:max-w-xl md:translate-x-[-50%] md:translate-y-[-50%]">
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
				<button className="btn preset-filled-primary-500" onClick={() => setSignInDialogOpen(true)}>
					Sign in
				</button>
			</Unauthenticated>

			{/* SignIn Dialog - Outside of auth wrappers to prevent disappearing during registration */}
			<Dialog.Root open={signInDialogOpen} onOpenChange={setSignInDialogOpen}>
				<Dialog.Content className="sm:rounded-container h-full w-full rounded-none sm:h-auto sm:w-4xl sm:max-w-md">
					<Dialog.Header>
						<Dialog.Title>Sign in</Dialog.Title>
					</Dialog.Header>
					<SignIn onSignIn={() => setSignInDialogOpen(false)} className="p-2 sm:p-8" />
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</>
	);
}
