'use client';

import Link from 'next/link';
import { Shield } from 'lucide-react';

import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import { useIsAppAdmin } from '@/components/admin/api/hooks';
import { ADMIN_ROUTE } from '@/components/admin/utils/admin.constants';

/**
 * Optional navigation link to the `/admin` dashboard. Renders nothing unless the
 * `admin` feature is enabled and the current user is an application admin.
 *
 * This is **not** mounted in the default layout — the admin dashboard is a route
 * (`/admin`) that operators navigate to directly. Drop this link into your own
 * nav/sidebar if you want a visible entry point.
 */
export default function AdminButton({ className }: { className?: string }) {
	const isAppAdmin = useIsAppAdmin();

	if (!AUTH_CONSTANTS.admin || !isAppAdmin) return null;

	return (
		<Link href={ADMIN_ROUTE} className={className ?? 'btn preset-tonal gap-2'}>
			<Shield className="size-4" aria-hidden="true" />
			<span>Admin</span>
		</Link>
	);
}
