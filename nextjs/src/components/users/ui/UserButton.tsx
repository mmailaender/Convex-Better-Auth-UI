'use client';

import { useState, type ComponentProps, type ReactNode } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useConvexAuth } from 'convex/react';
import { ChevronRight } from 'lucide-react';

import * as Avatar from '@/components/primitives/ui/avatar';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Popover from '@/components/primitives/ui/popover';
import SignIn from '@/components/auth/ui/SignIn';
import SignOutButton from '@/components/auth/ui/SignOutButton';
import { DIALOG_KEY } from '@/components/users/utils/user.constants';
import { useActiveUserData } from '@/lib/auth/hooks';

type PopoverRootProps = ComponentProps<typeof Popover.Root>;

export default function UserButton({
	popoverPlacement = 'bottom',
	signInTrigger
}: {
	popoverPlacement?: NonNullable<PopoverRootProps['positioning']>['placement'];
	/** Optional replacement for the default sign-in button. Receives `open` to
	 * launch the UserButton-owned sign-in dialog. */
	signInTrigger?: (context: Readonly<{ open: () => void }>) => ReactNode;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { isAuthenticated, isLoading } = useConvexAuth();
	const user = useActiveUserData();

	const [userPopoverOpen, setUserPopoverOpen] = useState(false);
	const [signInDialogOpen, setSignInDialogOpen] = useState(false);
	const [signInKey, setSignInKey] = useState(0);
	const [avatarStatus, setAvatarStatus] = useState('');

	function openProfileModal() {
		setUserPopoverOpen(false);
		const params = new URLSearchParams(searchParams.toString());
		if (params.get('dialog') !== DIALOG_KEY) {
			params.set('dialog', DIALOG_KEY);
			router.push(`${pathname}?${params.toString()}`, { scroll: false });
		}
	}

	return (
		<>
			{isLoading ? (
				<div className="flex size-10 items-center justify-center">
					<div className="placeholder-circle size-9 animate-pulse" />
				</div>
			) : !isAuthenticated ? (
				signInTrigger ? (
					signInTrigger({ open: () => setSignInDialogOpen(true) })
				) : (
					<button
						className="btn preset-filled-primary-500"
						onClick={() => setSignInDialogOpen(true)}
					>
						Sign in
					</button>
				)
			) : user ? (
				<Popover.Root
					open={userPopoverOpen}
					onOpenChange={setUserPopoverOpen}
					positioning={{
						placement: popoverPlacement,
						strategy: 'absolute',
						offset: { mainAxis: 8, crossAxis: 0 }
					}}
				>
					{/* Fixed px keeps browser root font-size preferences from changing control geometry. */}
					<Popover.Trigger className="flex size-10 items-center justify-center rounded-full">
						<Avatar.Root
							className="ring-surface-100-900 size-9 ring-0 duration-200 ease-out ring-inset hover:ring-4"
							onStatusChange={(details) => setAvatarStatus(details.status)}
						>
							<Avatar.Image src={user.image ?? undefined} alt={user.name} />
							<Avatar.Fallback>
								{avatarStatus === 'loading' ? (
									<div className="placeholder-circle size-full animate-pulse" />
								) : (
									<Avatar.Marble name={user.name} />
								)}
							</Avatar.Fallback>
						</Avatar.Root>
					</Popover.Trigger>
					<Popover.Content>
						<div className="flex flex-col gap-1 p-0">
							<button
								className="bg-surface-50-950 hover:bg-surface-100-900 rounded-container flex flex-row items-center gap-4 p-3 pr-6 duration-200 ease-in-out"
								onClick={openProfileModal}
							>
								<Avatar.Root className="size-12">
									<Avatar.Image src={user.image ?? undefined} alt={user.name} />
									<Avatar.Fallback>
										<Avatar.Marble name={user.name} />
									</Avatar.Fallback>
								</Avatar.Root>
								<div className="flex flex-1 flex-col gap-0 overflow-hidden">
									<p className="truncate text-left text-sm font-medium">{user.name}</p>
									<p className="truncate text-left text-xs opacity-75">{user.email}</p>
								</div>
								<ChevronRight className="size-4" />
							</button>
							<SignOutButton
								onSuccess={() => setUserPopoverOpen(false)}
								className="btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm"
							/>
						</div>
					</Popover.Content>
				</Popover.Root>
			) : (
				<div className="flex size-10 items-center justify-center">
					<div className="placeholder-circle size-9 animate-pulse" />
				</div>
			)}

			<Dialog.Root
				open={signInDialogOpen}
				onOpenChange={(nextOpen) => {
					setSignInDialogOpen(nextOpen);
					if (!nextOpen) setSignInKey((key) => key + 1);
				}}
			>
				<Dialog.Content className="sm:rounded-container h-full max-h-dvh w-full rounded-none sm:h-auto sm:max-h-[90vh] sm:w-4xl sm:max-w-md">
					<SignIn
						key={signInKey}
						onSignIn={() => setSignInDialogOpen(false)}
						className="p-2 sm:p-8"
					/>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</>
	);
}
