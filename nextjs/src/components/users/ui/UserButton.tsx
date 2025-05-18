'use client';

import { useState } from 'react';

// API
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery, Authenticated, Unauthenticated } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Components
import { Popover, PopoverContent, PopoverTrigger } from '@/components/primitives/ui/popover';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle
} from '@/components/primitives/ui/dialog';
import UserProfile from '@/components/users/ui/UserProfile';
import { Avatar } from '@skeletonlabs/skeleton-react';
import { ChevronRight } from 'lucide-react';

export default function UserButton({
	popoverSide = 'bottom',
	popoverAlign = 'end'
}: {
	popoverSide?: 'top' | 'right' | 'bottom' | 'left';
	popoverAlign?: 'start' | 'end' | 'center';
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
						<Popover open={open} onOpenChange={setOpen}>
							<PopoverTrigger>
								<Avatar
									src={user.image}
									name={user.name}
									size="size-10 ring-0 hover:ring-4 ring-surface-100-900 ease-out duration-200"
								/>
							</PopoverTrigger>
							<PopoverContent side={popoverSide} align={popoverAlign}>
								<div className="flex flex-col gap-1 p-0">
									<button
										className="bg-surface-50-950 hover:bg-surface-100-900 flex flex-row items-center gap-3 rounded-lg p-3 pr-6 duration-200 ease-in-out"
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
										<ChevronRight className="size-4" />
									</button>
									<button
										className="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
										onClick={() => void signOut()}
									>
										Sign out
									</button>
								</div>
							</PopoverContent>
						</Popover>

						{/* ProfileInfo Popup */}
						<Dialog open={profileOpen} onOpenChange={setProfileOpen}>
							<DialogContent className="max-w-xl">
								<DialogHeader>
									<DialogTitle>Profile</DialogTitle>
								</DialogHeader>
								<UserProfile />
							</DialogContent>
						</Dialog>
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
