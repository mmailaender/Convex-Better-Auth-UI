'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useConvexAuth, useQuery } from 'convex/react';
import { ShieldAlert } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import AdminDashboard from '@/components/admin/ui/AdminDashboard';
import { ADMIN_ROUTE } from '@/components/admin/utils/admin.constants';

/**
 * `/admin` — the application admin dashboard page.
 *
 * Gating is UX only; the real authorization boundary is the `requireAppAdmin`
 * guard enforced by every admin Convex function. Three outcomes:
 *  - signed out      → redirect to sign-in, returning here afterwards
 *  - signed in, not admin → 403 "Access denied" (see override note below)
 *  - admin           → the dashboard
 */
export default function AdminPage() {
	const router = useRouter();
	const { isAuthenticated, isLoading } = useConvexAuth();

	// `undefined` while loading, `true`/`false` once resolved.
	const isAdmin = useQuery(api.admin.queries.isCurrentUserAdmin, isAuthenticated ? {} : 'skip');

	// Signed-out visitors go to sign-in and are returned to /admin afterwards.
	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.replace(`/signin?redirectTo=${encodeURIComponent(ADMIN_ROUTE)}`);
		}
	}, [router, isLoading, isAuthenticated]);

	// Resolving auth or the admin check → a neutral spinner (no content flash).
	if (isLoading || !isAuthenticated || isAdmin === undefined) {
		return (
			<div className="flex min-h-[60vh] w-full items-center justify-center p-6">
				<div
					className="border-surface-300-700 size-6 animate-spin rounded-full border-2 border-t-transparent"
					role="status"
					aria-label="Loading"
				/>
			</div>
		);
	}

	// Signed in, but not an application admin.
	//
	// Default: a transparent 403 "Access denied" page — the conventional behavior
	// for admin tooling, and harmless because every admin Convex function enforces
	// access server-side regardless of what this page shows.
	//
	// ── To HIDE that an admin area exists instead (e.g. a public-facing app where
	//    regular users shouldn't know it's there), swap this block for Next's 404:
	//        import { notFound } from 'next/navigation';
	//        if (isAdmin === false) notFound();
	if (isAdmin === false) {
		return (
			<div className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
				<ShieldAlert className="size-10 opacity-60" aria-hidden="true" />
				<div>
					<h1 className="h4">Access denied</h1>
					<p className="text-surface-600-400 mt-1 text-sm">
						You don&apos;t have permission to view this page.
					</p>
				</div>
				<Link href="/" className="btn preset-tonal">
					Back to home
				</Link>
			</div>
		);
	}

	return (
		<div className="mx-auto w-full max-w-5xl p-4 sm:p-6">
			<h1 className="h3 mb-4">Admin</h1>
			<AdminDashboard />
		</div>
	);
}
