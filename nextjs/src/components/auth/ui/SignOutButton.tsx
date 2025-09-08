import { cn } from '../../../lib/utils';
import { authClient } from '../../../lib/auth/api/auth-client';
import { useRouter } from 'next/navigation';

export default function SignOutButton({
	onSuccess,
	onError,
	className
}: {
	onSuccess?: () => void;
	onError?: () => void;
	className?: string;
}) {
	const router = useRouter();
	return (
		<button
			className={cn(
				'btn preset-faded-surface-50-950 hover:bg-surface-200-800 h-10 justify-between gap-1 text-sm',
				className
			)}
			onClick={async () => {
				const result = await authClient.signOut();
				if (result.data?.success) {
					onSuccess?.();
					router.refresh();
				} else {
					onError?.();
				}
			}}
		>
			Sign out
		</button>
	);
}
