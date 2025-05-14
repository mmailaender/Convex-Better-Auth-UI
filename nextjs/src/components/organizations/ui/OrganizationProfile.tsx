// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/ui/tabs';
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
	return (
		<Tabs defaultValue="general" orientation="vertical">
			<TabsList>
				<TabsTrigger value="general">General</TabsTrigger>
				{isOwnerOrAdmin && (
					<>
						<TabsTrigger value="members">Members</TabsTrigger>
						<TabsTrigger value="billing">Billing</TabsTrigger>
					</>
				)}
			</TabsList>
			<TabsContent value="general">
				<OrganizationInfo />
				<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
				<LeaveOrganization />
			</TabsContent>
			{isOwnerOrAdmin && (
				<>
					<TabsContent value="members">
						<MembersAndInvitations />
					</TabsContent>
					<TabsContent value="billing">Billing Panel</TabsContent>
				</>
			)}
		</Tabs>
	);
}
