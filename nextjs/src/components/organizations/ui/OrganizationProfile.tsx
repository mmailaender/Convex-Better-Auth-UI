import { useState } from 'react';
import { Tabs } from '@skeletonlabs/skeleton-react';

// Components
import OrganizationInfo from '@/components/organizations/ui/OrganizationInfo';
import DeleteOrganization from '@/components/organizations/ui/DeleteOrganization';
import MembersAndInvitations from '@/components/organizations/ui/MembersAndInvitations';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';

// API
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';

interface OrganizationProfileProps {
	/**
	 * Optional callback that will be called when an organization is successfully deleted
	 */
	onSuccessfulDelete?: () => void;
}

export default function OrganizationProfile({ onSuccessfulDelete }: OrganizationProfileProps) {
	const isOwnerOrAdmin = useIsOwnerOrAdmin();
	const [group, setGroup] = useState('general');
	return (
		<Tabs value={group} onValueChange={(e) => setGroup(e.value)} base="flex flex-row w-192 h-160">
			<Tabs.List base="flex flex-col pr-2 w-30">
				<h1>Organization</h1>
				<h4>Manage your organization.</h4>
				<Tabs.Control
					value="general"
					base="border-r-1 border-transparent"
					stateActive="border-r-surface-950-50 opacity-100"
				>
					General
				</Tabs.Control>
				{isOwnerOrAdmin && (
					<>
						<Tabs.Control
							value="members"
							base="border-r-1 border-transparent"
							stateActive="border-r-surface-950-50 opacity-100"
						>
							Members
						</Tabs.Control>
						<Tabs.Control
							value="billing"
							base="border-r-1 border-transparent"
							stateActive="border-r-surface-950-50 opacity-100"
						>
							Billing
						</Tabs.Control>
					</>
				)}
			</Tabs.List>
			<Tabs.Content base="flex flex-col">
				<Tabs.Panel value="general">
					<OrganizationInfo />
					<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
					<LeaveOrganization />
				</Tabs.Panel>
				{isOwnerOrAdmin && (
					<>
						<Tabs.Panel value="members">
							<MembersAndInvitations />
						</Tabs.Panel>
						<Tabs.Panel value="billing">Billing Panel</Tabs.Panel>
					</>
				)}
			</Tabs.Content>
		</Tabs>
	);
}
