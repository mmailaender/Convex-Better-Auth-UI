'use client';

import { useState } from 'react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery, Authenticated, Unauthenticated } from 'convex/react';
import { Avatar } from '@skeletonlabs/skeleton-react';

import { api } from '@/convex/_generated/api';
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverTrigger
} from '@/components/primitives/ui/Popover';
import { Modal, ModalClose, ModalContent } from '@/components/primitives/ui/Modal';

import UserProfile from '@/components/users/ui/page/UserProfile';
import { Placement } from '@floating-ui/react';

export default function UserButton({
	popoverPlacement = 'bottom-end'
}: {
	popoverPlacement?: Placement;
}) {
	const { signOut } = useAuthActions();
	const user = useQuery(api.users.getUser);
	const [open, setOpen] = useState(false);
	const [profileOpen, setProfileOpen] = useState(false);

	return (
		<>
			<Authenticated>
				{user ? (
					<>
						<Popover open={open} onOpenChange={setOpen} placement={popoverPlacement}>
							<PopoverTrigger onClick={() => setOpen((v) => !v)}>
								<Avatar
									src={user.image}
									name={user.name}
									size="size-10 ring-0 hover:ring-4 ring-surface-100-900 ease-out duration-200"
								/>
							</PopoverTrigger>
							<PopoverContent className="bg-surface-200-800 w-80 rounded-xl p-1 transition-all duration-300 ease-in-out">
								<PopoverDescription>
									<div className="0 flex flex-col gap-1 p-0">
										<button
											className="bg-surface-50-950 flex flex-row items-center gap-3 rounded-lg p-3 pr-6 duration-200 ease-in-out"
											onClick={() => {
												setOpen(false);
												setProfileOpen(true);
											}}
										>
											<Avatar src={user.image} name={user.name} size="size-12" />
											<div className="flex flex-1 flex-col gap-0 overflow-hidden">
												<p className="truncate text-left text-base font-medium">{user.name}</p>
												<p className="text-surface-700-300 truncate text-left text-xs">
													{user.email}
												</p>
											</div>

											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 24 24"
												fill="currentColor"
												className="size-4"
											>
												<path
													fillRule="evenodd"
													d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z"
													clipRule="evenodd"
												/>
											</svg>
										</button>
										<button
											className="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
											onClick={() => void signOut()}
										>
											Sign out
										</button>
									</div>
								</PopoverDescription>
							</PopoverContent>
						</Popover>

						{/* ProfileInfo Popup */}
						<Modal open={profileOpen} onOpenChange={setProfileOpen}>
							<ModalContent className="bg-surface-200-800 relative rounded-xl p-1">
								<div className="flex items-center justify-between p-0">
									<UserProfile />
									<ModalClose />
								</div>
							</ModalContent>
						</Modal>

						<div className="relative">
							<button className="btn preset-filled-primary-500" onClick={() => void signOut()}>
								Sign out
							</button>
						</div>
					</>
				) : (
					<div className="placeholder-circle size-10 animate-pulse" />
				)}
			</Authenticated>
			<Unauthenticated>
				<a href="/login" className="btn preset-filled-primary-500">
					Sign in
				</a>
			</Unauthenticated>
		</>
	);
}
