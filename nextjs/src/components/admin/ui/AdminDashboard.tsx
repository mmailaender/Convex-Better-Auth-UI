'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Building2, Users } from 'lucide-react';

import * as Tabs from '@/components/primitives/ui/tabs';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import UsersTable from '@/components/admin/ui/UsersTable';
import OrganizationsTable from '@/components/admin/ui/OrganizationsTable';
import { TAB_ORGANIZATIONS, TAB_USERS } from '@/components/admin/utils/admin.constants';

/**
 * Admin dashboard body. Renders a Users tab always and an Organizations tab only
 * when the `organizations` feature toggle is enabled (in addition to `admin`).
 */
export default function AdminDashboard() {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	const organizationsEnabled = Boolean(AUTH_CONSTANTS.organizations);

	const activeTab = useMemo(() => {
		const param = searchParams.get('adminTab');
		if (param === TAB_ORGANIZATIONS && organizationsEnabled) return TAB_ORGANIZATIONS;
		return TAB_USERS;
	}, [searchParams, organizationsEnabled]);

	function setActiveTab(tab: string) {
		const params = new URLSearchParams(searchParams.toString());
		params.set('adminTab', tab);
		router.replace(`${pathname}?${params.toString()}`, { scroll: false });
	}

	return (
		<Tabs.Root value={activeTab} onValueChange={setActiveTab}>
			<Tabs.List className="flex gap-2">
				<Tabs.Trigger value={TAB_USERS} className="flex items-center gap-2">
					<Users className="size-4" />
					<span>Users</span>
				</Tabs.Trigger>
				{organizationsEnabled ? (
					<Tabs.Trigger value={TAB_ORGANIZATIONS} className="flex items-center gap-2">
						<Building2 className="size-4" />
						<span>Organizations</span>
					</Tabs.Trigger>
				) : null}
			</Tabs.List>

			<Tabs.Content value={TAB_USERS}>
				<UsersTable />
			</Tabs.Content>

			{organizationsEnabled ? (
				<Tabs.Content value={TAB_ORGANIZATIONS}>
					<OrganizationsTable />
				</Tabs.Content>
			) : null}
		</Tabs.Root>
	);
}
