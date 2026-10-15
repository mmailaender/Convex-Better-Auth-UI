'use client';

import { useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { toast } from 'sonner';
import { Loader2, VenetianMask } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth/api/auth-client';
import { useActiveUserData } from '@/lib/auth/hooks';
import { ADMIN_ROUTE } from '@/components/admin/utils/admin.constants';

/**
 * Banner shown while the current session is an admin impersonation
 * (`session.impersonatedBy` is set). Renders nothing otherwise. Mount it once in
 * the root layout (gated by `AUTH_CONSTANTS.admin`) so an impersonating admin
 * always sees who they are acting as and can return to their own session.
 */
export default function ImpersonationBanner() {
	const { isAuthenticated } = useConvexAuth();
	const activeUser = useActiveUserData();
	const impersonation = useQuery(
		api.admin.queries.getImpersonationStatus,
		isAuthenticated ? {} : 'skip'
	);
	const [stopping, setStopping] = useState(false);

	if (!impersonation) return null;

	async function handleStop() {
		setStopping(true);
		const { error } = await authClient.admin.stopImpersonating();
		if (error) {
			setStopping(false);
			toast.error(error.message ?? 'Failed to stop impersonating');
			return;
		}
		// Refresh the Convex JWT cookie the server renders with, then reload so every query
		// runs as the admin again
		await authClient.getSession();
		window.location.assign(ADMIN_ROUTE);
	}

	return (
		<div
			className="preset-filled-warning-500 sticky top-0 z-50 flex min-w-0 items-center justify-center gap-3 px-4 py-2 text-sm"
			role="status"
		>
			<VenetianMask className="size-4 shrink-0" aria-hidden="true" />
			<span className="truncate">
				You are impersonating <strong>{activeUser?.name ?? 'another user'}</strong>
			</span>
			<button
				type="button"
				className="btn btn-sm preset-outlined shrink-0"
				onClick={handleStop}
				disabled={stopping}
				aria-busy={stopping}
			>
				{stopping ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
				Stop impersonating
			</button>
		</div>
	);
}
